import type { DBAsync } from "@vlcn.io/xplat-api";
import { RxBridge } from "./rxBridge";

export type RuleonDb = DBAsync;

export interface DbContext {
  db: RuleonDb;
  rx: RxBridge;
  dispose?: () => Promise<void>;
}
