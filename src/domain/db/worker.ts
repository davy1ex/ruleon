/// <reference lib="webworker" />
import { handleWorkerRequest } from "./workerHandlers";
import type { WorkerRequest, WorkerResponse } from "./rpcTypes";

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  void handleWorkerRequest(event.data);
});

self.postMessage({ type: "ready" } satisfies WorkerResponse);
