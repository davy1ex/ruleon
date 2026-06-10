import type { StmtAsync, TXAsync } from "@vlcn.io/xplat-api";
import type { DbRpc } from "./dbClient";
import { TxStmtClient } from "./stmtClient";

export class TxClient implements TXAsync {
  readonly __mutex = {} as TXAsync["__mutex"];
  readonly #rpc: DbRpc;
  readonly #clientTxId: number;

  constructor(rpc: DbRpc, clientTxId: number) {
    this.#rpc = rpc;
    this.#clientTxId = clientTxId;
  }

  getClientTxId(): number {
    return this.#clientTxId;
  }

  async execMany(sql: string[]): Promise<void> {
    for (const statement of sql) {
      await this.exec(statement);
    }
  }

  async exec(sql: string, bind?: unknown[]): Promise<void> {
    await this.#rpc.request("txExec", {
      clientTxId: this.#clientTxId,
      sql,
      bind,
    });
  }

  async execO<T extends object>(sql: string, bind?: unknown[]): Promise<T[]> {
    const rows = await this.execA<unknown[]>(sql, bind);
    return rows as T[];
  }

  async execA<T extends unknown[]>(sql: string, bind?: unknown[]): Promise<T[]> {
    await this.exec(sql, bind);
    return [];
  }

  async prepare(sql: string): Promise<StmtAsync> {
    const stmtId = (await this.#rpc.request("txPrepare", {
      clientTxId: this.#clientTxId,
      sql,
    })) as number;
    return new TxStmtClient(this.#rpc, this.#clientTxId, stmtId);
  }

  async tx(): Promise<void> {
    throw new Error("Nested db.tx over RPC is not supported");
  }

  async imperativeTx(): Promise<[() => void, TXAsync]> {
    throw new Error("imperativeTx over RPC is not supported");
  }
}
