import type { UpdateType } from "@vlcn.io/xplat-api";
import type { Src } from "@vlcn.io/rx-tbl";
import type { WorkerResponse } from "./rpcTypes";

type RangeCallback = (updates: UpdateType[]) => void;
type AnyCallback = (updates: UpdateType[], src: Src) => void;

export class RxBridge {
  readonly #worker: Worker;
  readonly #subscriptions = new Map<number, RangeCallback | AnyCallback>();
  #nextSubscriptionId = 1;
  #disposed = false;

  constructor(worker: Worker) {
    this.#worker = worker;
    worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      if (data.type === "rxEvent") {
        const cb = this.#subscriptions.get(data.subscriptionId);
        if (cb) {
          (cb as RangeCallback)(data.updates as UpdateType[]);
        }
      }
    });
  }

  onRange(tables: string[], cb: (updates: UpdateType[]) => void): () => void {
    if (this.#disposed) {
      return () => {};
    }
    const subscriptionId = this.#nextSubscriptionId++;
    this.#subscriptions.set(subscriptionId, cb);
    this.#worker.postMessage({
      type: "rxSubscribe",
      requestId: 0,
      subscriptionId,
      tables,
    });
    return () => {
      this.#subscriptions.delete(subscriptionId);
      this.#worker.postMessage({
        type: "rxUnsubscribe",
        requestId: 0,
        subscriptionId,
      });
    };
  }

  onPoint(): () => void {
    return () => {};
  }

  onAny(cb: (updates: UpdateType[], src: Src) => void): () => void {
    const subscriptionId = this.#nextSubscriptionId++;
    const wrapper = (updates: UpdateType[]) => cb(updates, "thisProcess");
    this.#subscriptions.set(subscriptionId, wrapper);
    this.#worker.postMessage({
      type: "rxSubscribe",
      requestId: 0,
      subscriptionId,
      tables: ["outline_nodes", "block_links", "kv_state", "node_links"],
    });
    return () => {
      this.#subscriptions.delete(subscriptionId);
      this.#worker.postMessage({
        type: "rxUnsubscribe",
        requestId: 0,
        subscriptionId,
      });
    };
  }

  dispose(): void {
    this.#disposed = true;
    for (const subscriptionId of this.#subscriptions.keys()) {
      this.#worker.postMessage({
        type: "rxUnsubscribe",
        requestId: 0,
        subscriptionId,
      });
    }
    this.#subscriptions.clear();
  }
}
