/// <reference lib="webworker" />
import initWasm from "@vlcn.io/crsqlite-wasm";
import wasmUrl from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";
import tblrx from "@vlcn.io/rx-tbl";
import type { DB as WasmDB } from "@vlcn.io/crsqlite-wasm";
import { ensureSchemaApplied } from "./ensureSyncSchema";
import { migrateNodeLinksToBlockLinks } from "./migrateBlockLinks";
import type { WorkerRequest, WorkerResponse } from "./rpcTypes";
import {
  allocStmtId,
  db,
  getTx,
  openTxGate,
  respond,
  respondError,
  resolveStmtContext,
  rx,
  rxDisposers,
  setDb,
  setRx,
  stmts,
  txGates,
} from "./workerContext";
import { startSyncInWorker, stopSyncInWorker } from "./workerSync";

type SqlBind = Parameters<WasmDB["exec"]>[1];

export async function handleWorkerRequest(message: WorkerRequest): Promise<void> {
  const requestId = "requestId" in message ? message.requestId : 0;

  try {
    switch (message.type) {
      case "init": {
        const sqlite = await initWasm(() => wasmUrl);
        const opened = await sqlite.open(message.dbName);
        setDb(opened);
        await db!.exec("PRAGMA journal_mode = WAL;");
        await ensureSchemaApplied(db!, message.schemaSql);
        await migrateNodeLinksToBlockLinks(db!);
        setRx(tblrx(db!));
        respond(requestId, {
          filename: db!.filename,
          siteid: db!.siteid,
        });
        break;
      }
      case "exec":
        await db!.exec(message.sql, message.bind as SqlBind);
        respond(requestId);
        break;
      case "execA":
        respond(requestId, await db!.execA(message.sql, message.bind as SqlBind));
        break;
      case "execO":
        respond(requestId, await db!.execO(message.sql, message.bind as SqlBind));
        break;
      case "execMany":
        await db!.execMany(message.sql);
        respond(requestId);
        break;
      case "automigrateTo":
        respond(
          requestId,
          await db!.automigrateTo(message.schemaName, message.schemaContent),
        );
        break;
      case "prepare": {
        const stmt = await db!.prepare(message.sql);
        const stmtId = allocStmtId();
        stmts.set(stmtId, stmt);
        respond(requestId, stmtId);
        break;
      }
      case "stmtFinalize": {
        const stmt = stmts.get(message.stmtId);
        if (stmt) {
          await stmt.finalize(resolveStmtContext(message.txId));
          stmts.delete(message.stmtId);
        }
        respond(requestId);
        break;
      }
      case "stmtRaw": {
        stmts.get(message.stmtId)?.raw(message.isRaw);
        respond(requestId);
        break;
      }
      case "stmtCall": {
        const stmt = stmts.get(message.stmtId);
        if (!stmt) {
          throw new Error(`Unknown statement ${message.stmtId}`);
        }
        const result = await stmt[message.method](
          resolveStmtContext(message.txId),
          ...message.args,
        );
        respond(requestId, result);
        break;
      }
      case "txOpen":
        await openTxGate(message.clientTxId);
        respond(requestId);
        break;
      case "txExec":
        await getTx(message.clientTxId).exec(
          message.sql,
          message.bind as SqlBind,
        );
        respond(requestId);
        break;
      case "txPrepare": {
        const stmt = await getTx(message.clientTxId).prepare(message.sql);
        const stmtId = allocStmtId();
        stmts.set(stmtId, stmt);
        respond(requestId, stmtId);
        break;
      }
      case "txStmtCall": {
        const stmt = stmts.get(message.stmtId);
        if (!stmt) {
          throw new Error(`Unknown statement ${message.stmtId}`);
        }
        const result = await stmt[message.method](
          getTx(message.clientTxId),
          ...message.args,
        );
        respond(requestId, result);
        break;
      }
      case "txClose": {
        const gate = txGates.get(message.clientTxId);
        if (gate) {
          gate.finish(message.ok);
          txGates.delete(message.clientTxId);
        }
        respond(requestId);
        break;
      }
      case "rxSubscribe": {
        const disposer = rx!.onRange(message.tables, (updates) => {
          self.postMessage({
            type: "rxEvent",
            subscriptionId: message.subscriptionId,
            updates,
          } satisfies WorkerResponse);
        });
        rxDisposers.set(message.subscriptionId, disposer);
        respond(requestId);
        break;
      }
      case "rxUnsubscribe": {
        rxDisposers.get(message.subscriptionId)?.();
        rxDisposers.delete(message.subscriptionId);
        respond(requestId);
        break;
      }
      case "syncStart":
        await startSyncInWorker(db!, message.url, message.apiKey, (status) => {
          self.postMessage({ type: "syncStatus", status } satisfies WorkerResponse);
        });
        respond(requestId);
        break;
      case "syncStop":
        stopSyncInWorker();
        respond(requestId);
        break;
      case "close":
        stopSyncInWorker();
        rx?.dispose();
        setRx(null);
        await db?.close();
        setDb(null);
        stmts.clear();
        respond(requestId);
        break;
      default:
        respondError(requestId, "Unknown request type");
    }
  } catch (error) {
    respondError(requestId, error);
  }
}
