import type { DBAsync, StmtAsync, TXAsync } from "@vlcn.io/xplat-api";
import type { WorkerRequest, WorkerResponse } from "./rpcTypes";
import { StmtClient } from "./stmtClient";
import { TxClient } from "./txClient";

type Pending = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

export class DbRpc {
  readonly #worker: Worker;
  readonly #pending = new Map<number, Pending>();
  #nextRequestId = 1;
  readonly #stmts = new Map<number, StmtClient>();
  readonly #txClients = new Map<number, TxClient>();
  #nextClientTxId = 1;

  constructor(worker: Worker) {
    this.#worker = worker;
    worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      this.#onMessage(event.data);
    });
  }

  #onMessage(data: WorkerResponse): void {
    if (data.type === "response") {
      const pending = this.#pending.get(data.requestId);
      if (!pending) {
        return;
      }
      this.#pending.delete(data.requestId);
      if (data.ok) {
        pending.resolve(data.result);
      } else {
        pending.reject(new Error(data.error));
      }
    }
  }

  async request(
    type: WorkerRequest["type"],
    payload: Omit<WorkerRequest, "type" | "requestId">,
  ): Promise<unknown> {
    const requestId = this.#nextRequestId++;
    const message = { type, requestId, ...payload } as WorkerRequest;
    return new Promise((resolve, reject) => {
      this.#pending.set(requestId, { resolve, reject });
      this.#worker.postMessage(message);
    });
  }

  registerTx(clientTxId: number, tx: TxClient): void {
    this.#txClients.set(clientTxId, tx);
  }

  unregisterTx(clientTxId: number): void {
    this.#txClients.delete(clientTxId);
  }

  resolveTxId(tx: TXAsync | null): number | null {
    if (tx == null) {
      return null;
    }
    if (tx instanceof TxClient) {
      return tx.getClientTxId();
    }
    return null;
  }

  forgetStmt(stmtId: number): void {
    this.#stmts.delete(stmtId);
  }

  registerStmt(stmtId: number, stmt: StmtClient): void {
    this.#stmts.set(stmtId, stmt);
  }

  allocClientTxId(): number {
    return this.#nextClientTxId++;
  }
}

export class RuleonDb implements DBAsync {
  readonly __mutex = {} as DBAsync["__mutex"];
  readonly #rpc: DbRpc;
  readonly filename: string;
  readonly siteid: string;
  readonly tablesUsedStmt: StmtAsync;

  constructor(rpc: DbRpc, meta: { filename: string; siteid: string }) {
    this.#rpc = rpc;
    this.filename = meta.filename;
    this.siteid = meta.siteid;
    this.tablesUsedStmt = {
      run: async () => {},
      get: async () => undefined,
      all: async () => [],
      iterate: async function* () {},
      raw: () => this.tablesUsedStmt,
      bind: () => this.tablesUsedStmt,
      finalize: async () => {},
    };
  }

  async execMany(sql: string[]): Promise<void> {
    await this.#rpc.request("execMany", { sql });
  }

  async exec(sql: string, bind?: unknown[]): Promise<void> {
    await this.#rpc.request("exec", { sql, bind });
  }

  async execO<T extends object>(sql: string, bind?: unknown[]): Promise<T[]> {
    return this.#rpc.request("execO", { sql, bind }) as Promise<T[]>;
  }

  async execA<T extends unknown[]>(sql: string, bind?: unknown[]): Promise<T[]> {
    return this.#rpc.request("execA", { sql, bind }) as Promise<T[]>;
  }

  async prepare(sql: string): Promise<StmtAsync> {
    const stmtId = (await this.#rpc.request("prepare", { sql })) as number;
    const stmt = new StmtClient(this.#rpc, stmtId);
    this.#rpc.registerStmt(stmtId, stmt);
    return stmt;
  }

  async tx(cb: (tx: TXAsync) => Promise<void>): Promise<void> {
    const clientTxId = this.#rpc.allocClientTxId();
    await this.#rpc.request("txOpen", { clientTxId });
    const txClient = new TxClient(this.#rpc, clientTxId);
    this.#rpc.registerTx(clientTxId, txClient);
    try {
      await cb(txClient);
      await this.#rpc.request("txClose", { clientTxId, ok: true });
    } catch (error) {
      await this.#rpc.request("txClose", { clientTxId, ok: false });
      throw error;
    } finally {
      this.#rpc.unregisterTx(clientTxId);
    }
  }

  async imperativeTx(): Promise<[() => void, TXAsync]> {
    throw new Error("imperativeTx over RPC is not supported");
  }

  async close(): Promise<void> {
    await this.#rpc.request("close", {});
  }

  createFunction(): void {
    throw new Error("createFunction over RPC is not supported");
  }

  onUpdate(): () => void {
    return () => {};
  }

  async automigrateTo(
    schemaName: string,
    schemaContent: string,
  ): Promise<"noop" | "apply" | "migrate"> {
    return this.#rpc.request("automigrateTo", {
      schemaName,
      schemaContent,
    }) as Promise<"noop" | "apply" | "migrate">;
  }

}
