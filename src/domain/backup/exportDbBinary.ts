import type { DB as WasmDB } from "@vlcn.io/crsqlite-wasm";

interface IdbFileBlock {
  path: string;
  offset: number;
  version: number;
  data: Uint8Array;
  fileSize?: number;
}

function openIdb(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readBlocks(
  store: IDBObjectStore,
  path: string,
): Promise<IdbFileBlock[]> {
  return new Promise((resolve, reject) => {
    const range = IDBKeyRange.bound([path], [path, []]);
    const request = store.getAll(range);
    request.onsuccess = () => resolve(request.result as IdbFileBlock[]);
    request.onerror = () => reject(request.error);
  });
}

function dbPathFromFilename(filename: string): string {
  return filename.startsWith("/") ? filename : `/${filename}`;
}

/** Matches `IDBBatchAtomicVFS` name in `@vlcn.io/crsqlite-wasm` (`initWasm`). */
const IDB_DATABASE_NAME = "idb-batch-atomic";

async function readIdbDatabaseFile(path: string): Promise<Uint8Array> {
  const idb = await openIdb(IDB_DATABASE_NAME);
  try {
    const tx = idb.transaction("blocks", "readonly");
    const blocks = await readBlocks(tx.objectStore("blocks"), path);
    if (blocks.length === 0) {
      throw new Error(`No IndexedDB blocks found for ${path}`);
    }

    const version = Math.max(...blocks.map((block) => block.version));
    const fileBlocks = blocks.filter((block) => block.version === version);
    const block0 = fileBlocks.find((block) => block.offset === 0);
    if (!block0?.fileSize) {
      throw new Error(`Missing block0 metadata for ${path}`);
    }

    const fileSize = block0.fileSize;
    const output = new Uint8Array(fileSize);

    for (const block of fileBlocks) {
      const start = block.offset === 0 ? 0 : -block.offset;
      output.set(block.data, start);
    }

    return output;
  } finally {
    idb.close();
  }
}

export async function exportDbBinary(
  db: WasmDB,
  dbFileName: string,
): Promise<Uint8Array> {
  await db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
  return readIdbDatabaseFile(dbPathFromFilename(dbFileName));
}
