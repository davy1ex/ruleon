import type { RuleonDb as DB } from "../db/types";
import { ensureWelcomePage } from "./welcomePage";

function newId(): string {
  return crypto.randomUUID();
}

function now(): number {
  return Date.now();
}

export async function seedIfEmpty(db: DB): Promise<void> {
  await ensureWelcomePage(db);
}

export function createNodeId(): string {
  return newId();
}

export function currentTimestamp(): number {
  return now();
}
