import type { DB as SyncDB } from "@vlcn.io/ws-client";
import type { DB as WasmDB } from "@vlcn.io/crsqlite-wasm";
import type { Change } from "@vlcn.io/ws-common";
import tblrx from "@vlcn.io/rx-tbl";
import { firstPick, type StmtAsync } from "@vlcn.io/xplat-api";

const ENVIRONMENT_IS_WORKER =
  typeof globalThis !== "undefined" &&
  "importScripts" in globalThis &&
  typeof (globalThis as { importScripts?: () => void }).importScripts ===
    "function";

class WrappedWasmDB implements SyncDB {
  readonly #db: WasmDB;
  readonly #pullChangesetStmt: StmtAsync;
  readonly #applyChangesetStmt: StmtAsync;
  readonly #updatePeerTrackerStmt: StmtAsync;
  readonly #schemaName: string;
  readonly #schemaVersion: bigint;
  readonly #rx: ReturnType<typeof tblrx>;

  constructor(
    db: WasmDB,
    public readonly siteid: Uint8Array,
    schemaName: string,
    schemaVersion: bigint,
    pullChangesetStmt: StmtAsync,
    applyChangesetStmt: StmtAsync,
    updatePeerTrackerStmt: StmtAsync,
  ) {
    this.#db = db;
    this.#pullChangesetStmt = pullChangesetStmt;
    this.#applyChangesetStmt = applyChangesetStmt;
    this.#updatePeerTrackerStmt = updatePeerTrackerStmt;
    this.#schemaName = schemaName;
    this.#schemaVersion = schemaVersion;
    this.#rx = tblrx(db);
  }

  async pullChangeset(
    since: readonly [bigint, number],
    excludeSites: readonly Uint8Array[],
    localOnly: boolean,
  ): Promise<readonly Change[]> {
    void localOnly;
    const ret = await this.#pullChangesetStmt.all(
      null,
      since[0],
      excludeSites[0],
    );
    for (const change of ret) {
      change[4] = BigInt(change[4]);
      change[5] = BigInt(change[5]);
      change[7] = BigInt(change[7]);
    }
    return ret;
  }

  async applyChangesetAndSetLastSeen(
    changes: readonly Change[],
    siteId: Uint8Array,
    end: readonly [bigint, number],
  ): Promise<void> {
    await this.#db.tx(async (tx) => {
      for (const change of changes) {
        await this.#applyChangesetStmt.run(
          tx,
          change[0],
          change[1],
          change[2],
          change[3],
          change[4],
          change[5],
          siteId,
          change[7],
          change[8],
        );
      }
      await this.#updatePeerTrackerStmt.run(tx, siteId, 0, end[0], end[1]);
    });
  }

  async getLastSeens(): Promise<[Uint8Array, [bigint, number]][]> {
    const rows = await this.#db.execA<[Uint8Array, bigint | number, number]>(
      `SELECT site_id, version, seq FROM crsql_tracked_peers`,
    );
    return rows.map((row) => [row[0], [BigInt(row[1]), row[2]]]);
  }

  async getSchemaNameAndVersion(): Promise<[string, bigint]> {
    return [this.#schemaName, this.#schemaVersion];
  }

  onChange(cb: () => void): () => void {
    return this.#rx.onAny((_, src) => {
      if (ENVIRONMENT_IS_WORKER) {
        if (src !== "thisProcess") {
          cb();
        }
        return;
      }
      cb();
    });
  }

  close(closeWrappedDB: boolean): void {
    this.#pullChangesetStmt.finalize(null);
    this.#applyChangesetStmt.finalize(null);
    this.#updatePeerTrackerStmt.finalize(null);
    this.#rx.dispose();
    if (closeWrappedDB) {
      this.#db.close();
    }
  }
}

export async function wrapExistingWasmDb(db: WasmDB): Promise<SyncDB> {
  const [pullChangesetStmt, applyChangesetStmt, updatePeerTrackerStmt] =
    await Promise.all([
      db.prepare(
        `SELECT "table", "pk", "cid", "val", "col_version", "db_version", NULL, "cl", seq FROM crsql_changes WHERE db_version > ? AND site_id IS NOT ?`,
      ),
      db.prepare(
        `INSERT INTO crsql_changes ("table", "pk", "cid", "val", "col_version", "db_version", "site_id", "cl", "seq") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ),
      db.prepare(
        `INSERT INTO "crsql_tracked_peers" ("site_id", "event", "version", "seq", "tag") VALUES (?, ?, ?, ?, 0) ON CONFLICT DO UPDATE SET
        "version" = MAX("version", excluded."version"),
        "seq" = CASE "version" > excluded."version" WHEN 1 THEN "seq" ELSE excluded."seq" END`,
      ),
    ]);
  pullChangesetStmt.raw(true);

  const siteid = (await db.execA<[Uint8Array]>(`SELECT crsql_site_id()`))[0][0];
  const schemaName = firstPick<string>(
    await db.execA<[string]>(
      `SELECT value FROM crsql_master WHERE key = 'schema_name'`,
    ),
  );
  if (schemaName == null) {
    throw new Error("The database does not have a schema applied.");
  }
  const schemaVersion = BigInt(
    firstPick<number | bigint>(
      await db.execA<[number | bigint]>(
        `SELECT value FROM crsql_master WHERE key = 'schema_version'`,
      ),
    ) || -1,
  );

  return new WrappedWasmDB(
    db,
    siteid,
    schemaName,
    schemaVersion,
    pullChangesetStmt,
    applyChangesetStmt,
    updatePeerTrackerStmt,
  );
}
