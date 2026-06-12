import type { SyncStatus } from "./syncStatus";

export type WorkerRequest =
  | { type: "init"; requestId: number; dbName: string; schemaSql: string }
  | { type: "exec"; requestId: number; sql: string; bind?: unknown[] }
  | { type: "execA"; requestId: number; sql: string; bind?: unknown[] }
  | { type: "execO"; requestId: number; sql: string; bind?: unknown[] }
  | { type: "execMany"; requestId: number; sql: string[] }
  | { type: "automigrateTo"; requestId: number; schemaName: string; schemaContent: string }
  | { type: "prepare"; requestId: number; sql: string }
  | { type: "stmtFinalize"; requestId: number; stmtId: number; txId: number | null }
  | { type: "stmtRaw"; requestId: number; stmtId: number; isRaw: boolean }
  | {
      type: "stmtCall";
      requestId: number;
      stmtId: number;
      txId: number | null;
      method: "run" | "get" | "all";
      args: unknown[];
    }
  | { type: "txOpen"; requestId: number; clientTxId: number }
  | { type: "txExec"; requestId: number; clientTxId: number; sql: string; bind?: unknown[] }
  | {
      type: "txPrepare";
      requestId: number;
      clientTxId: number;
      sql: string;
    }
  | {
      type: "txStmtCall";
      requestId: number;
      clientTxId: number;
      stmtId: number;
      method: "run" | "get" | "all";
      args: unknown[];
    }
  | { type: "txClose"; requestId: number; clientTxId: number; ok: boolean }
  | { type: "rxSubscribe"; requestId: number; subscriptionId: number; tables: string[] }
  | { type: "rxUnsubscribe"; requestId: number; subscriptionId: number }
  | { type: "syncStart"; requestId: number; url: string; apiKey: string }
  | { type: "syncStop"; requestId: number }
  | { type: "getSchemaVersion"; requestId: number }
  | { type: "close"; requestId: number };

export type WorkerResponse =
  | { type: "response"; requestId: number; ok: true; result?: unknown }
  | { type: "response"; requestId: number; ok: false; error: string }
  | { type: "rxEvent"; subscriptionId: number; updates: number[] }
  | { type: "syncStatus"; status: SyncStatus }
  | { type: "syncDataChanged" }
  | { type: "ready" };
