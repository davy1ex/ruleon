import type { RuleonDb as DB } from "../db/types";
import { dedupeInboxPages, ensureInboxPage } from "./inboxPage";
import { ensureWelcomePage } from "./welcomePage";

function newId(): string {
  return crypto.randomUUID();
}

function now(): number {
  return Date.now();
}

export async function seedIfEmpty(db: DB): Promise<void> {
  await ensureWelcomePage(db);
  await ensureInboxPage(db);
  await dedupeInboxPages(db);
}

export function createNodeId(): string {
  return newId();
}

export function currentTimestamp(): number {
  return now();
}
