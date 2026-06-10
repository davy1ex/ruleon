import type { StmtAsync, TXAsync } from "@vlcn.io/xplat-api";
import type { DbRpc } from "./dbClient";

export class StmtClient implements StmtAsync {
  readonly #rpc: DbRpc;
  readonly #stmtId: number;

  constructor(rpc: DbRpc, stmtId: number) {
    this.#rpc = rpc;
    this.#stmtId = stmtId;
  }

  raw(isRaw = true): this {
    void this.#rpc.request("stmtRaw", {
      stmtId: this.#stmtId,
      isRaw,
    });
    return this;
  }

  bind(..._args: readonly unknown[]): this {
    void _args;
    return this;
  }

  async run(tx: TXAsync | null, ...bindArgs: unknown[]): Promise<void> {
    await this.#rpc.request("stmtCall", {
      stmtId: this.#stmtId,
      txId: this.#rpc.resolveTxId(tx),
      method: "run",
      args: bindArgs,
    });
  }

  async get(tx: TXAsync | null, ...bindArgs: unknown[]): Promise<unknown> {
    return this.#rpc.request("stmtCall", {
      stmtId: this.#stmtId,
      txId: this.#rpc.resolveTxId(tx),
      method: "get",
      args: bindArgs,
    });
  }

  async all(tx: TXAsync | null, ...bindArgs: unknown[]): Promise<unknown[]> {
    return this.#rpc.request("stmtCall", {
      stmtId: this.#stmtId,
      txId: this.#rpc.resolveTxId(tx),
      method: "all",
      args: bindArgs,
    }) as Promise<unknown[]>;
  }

  iterate<T>(..._args: [TXAsync | null, ...unknown[]]): AsyncIterator<T> {
    void _args;
    throw new Error("StmtClient.iterate is not supported over RPC");
  }

  async finalize(tx: TXAsync | null): Promise<void> {
    await this.#rpc.request("stmtFinalize", {
      stmtId: this.#stmtId,
      txId: this.#rpc.resolveTxId(tx),
    });
    this.#rpc.forgetStmt(this.#stmtId);
  }
}

export class TxStmtClient implements StmtAsync {
  readonly #rpc: DbRpc;
  readonly #clientTxId: number;
  readonly #stmtId: number;

  constructor(rpc: DbRpc, clientTxId: number, stmtId: number) {
    this.#rpc = rpc;
    this.#clientTxId = clientTxId;
    this.#stmtId = stmtId;
  }

  raw(..._args: [boolean?]): this {
    void _args;
    return this;
  }

  bind(..._args: readonly unknown[]): this {
    void _args;
    return this;
  }

  async run(_tx: TXAsync | null, ...bindArgs: unknown[]): Promise<void> {
    await this.#rpc.request("txStmtCall", {
      clientTxId: this.#clientTxId,
      stmtId: this.#stmtId,
      method: "run",
      args: bindArgs,
    });
  }

  async get(_tx: TXAsync | null, ...bindArgs: unknown[]): Promise<unknown> {
    return this.#rpc.request("txStmtCall", {
      clientTxId: this.#clientTxId,
      stmtId: this.#stmtId,
      method: "get",
      args: bindArgs,
    });
  }

  async all(_tx: TXAsync | null, ...bindArgs: unknown[]): Promise<unknown[]> {
    return this.#rpc.request("txStmtCall", {
      clientTxId: this.#clientTxId,
      stmtId: this.#stmtId,
      method: "all",
      args: bindArgs,
    }) as Promise<unknown[]>;
  }

  iterate<T>(): AsyncIterator<T> {
    throw new Error("TxStmtClient.iterate is not supported over RPC");
  }

  async finalize(): Promise<void> {
    this.#rpc.forgetStmt(this.#stmtId);
  }
}
