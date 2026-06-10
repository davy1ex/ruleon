/// <reference lib="webworker" />
import type { DB as WasmDB } from "@vlcn.io/crsqlite-wasm";
import type { StmtAsync, TXAsync } from "@vlcn.io/xplat-api";
import type { TblRx } from "@vlcn.io/rx-tbl";
import type { WorkerResponse } from "./rpcTypes";

export let db: WasmDB | null = null;
export let rx: TblRx | null = null;
export let nextStmtId = 1;
export const stmts = new Map<number, StmtAsync>();

interface TxGate {
  workerTx: TXAsync | null;
  finish: (ok: boolean) => void;
}

export const txGates = new Map<number, TxGate>();
export const rxDisposers = new Map<number, () => void>();

export function respond(requestId: number, result?: unknown): void {
  const message: WorkerResponse = { type: "response", requestId, ok: true, result };
  self.postMessage(message);
}

export function respondError(requestId: number, error: unknown): void {
  const message: WorkerResponse = {
    type: "response",
    requestId,
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  };
  self.postMessage(message);
}

export function getTx(clientTxId: number): TXAsync {
  const gate = txGates.get(clientTxId);
  if (!gate?.workerTx) {
    throw new Error(`Transaction ${clientTxId} is not open`);
  }
  return gate.workerTx;
}

export function resolveStmtContext(
  txId: number | null,
  clientTxId?: number,
): TXAsync | null {
  if (clientTxId != null) {
    return getTx(clientTxId);
  }
  if (txId != null) {
    return getTx(txId);
  }
  return null;
}

export async function openTxGate(clientTxId: number): Promise<void> {
  let resolveReady!: () => void;
  let resolveDone!: () => void;
  let rejectDone!: (error: Error) => void;

  const readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  const gate: TxGate = {
    workerTx: null,
    finish: (ok) => {
      if (ok) {
        resolveDone();
      } else {
        rejectDone(new Error("Transaction rolled back"));
      }
    },
  };

  txGates.set(clientTxId, gate);

  void db!.tx(async (workerTx) => {
    gate.workerTx = workerTx;
    resolveReady();
    await new Promise<void>((resolve, reject) => {
      resolveDone = resolve;
      rejectDone = reject;
    });
  });

  await readyPromise;
}

export function setDb(next: WasmDB | null): void {
  db = next;
}

export function setRx(next: TblRx | null): void {
  rx = next;
}

export function allocStmtId(): number {
  return nextStmtId++;
}
