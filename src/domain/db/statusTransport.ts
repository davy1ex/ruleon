import {
  AnnouncePresence,
  Changes,
  RejectChanges,
  StartStreaming,
  decode,
  encode,
  tags,
} from "@vlcn.io/ws-common";
import type { SyncStatus } from "./syncStatus";

type TransporOptions = {
  url: string;
  room: string;
  authToken?: string;
  schemaVersion?: string;
};

interface Transport {
  start(onReady: () => void): void;
  announcePresence(msg: AnnouncePresence): void;
  sendChanges(msg: Changes): "reconnecting" | "buffer-full" | "sent";
  rejectChanges(msg: RejectChanges): void;
  onChangesReceived: ((msg: Changes) => Promise<void>) | null;
  onStartStreaming: ((msg: StartStreaming) => Promise<void>) | null;
  onResetStream: ((msg: StartStreaming) => Promise<void>) | null;
  close(): void;
}

const SYNC_IDLE_MS = 600;

export function createStatusTransportProvider(
  onStatus: (status: SyncStatus) => void,
): (transportOpts: TransporOptions) => Transport {
  return (transportOpts) => new StatusReportingTransport(transportOpts, onStatus);
}

class StatusReportingTransport implements Transport {
  #socket: WebSocket | null = null;
  #hadStartStream = false;
  #closed = false;
  #options: TransporOptions;
  #onReady: (() => void) | null = null;
  #keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  #idleTimer: ReturnType<typeof setTimeout> | null = null;
  #onStatus: (status: SyncStatus) => void;

  onChangesReceived: ((msg: Changes) => Promise<void>) | null = null;
  onStartStreaming: ((msg: StartStreaming) => Promise<void>) | null = null;
  onResetStream: ((msg: StartStreaming) => Promise<void>) | null = null;

  constructor(options: TransporOptions, onStatus: (status: SyncStatus) => void) {
    this.#options = options;
    this.#onStatus = onStatus;
  }

  start(onReady: () => void) {
    this.#onReady = onReady;
    this.#onStatus("connecting");
    this.#socket = this.#openSocketAndKeepAlive(this.#options);
  }

  #openSocketAndKeepAlive(options: TransporOptions) {
    if (this.#closed) {
      return null;
    }

    if (this.#keepAliveInterval == null) {
      this.#keepAliveInterval = setInterval(() => {
        if (!this.#socket || this.#socket.readyState === WebSocket.CLOSED) {
          this.#onStatus("connecting");
          this.#openSocketAndKeepAlive(options);
        }
      }, Math.random() * 2000 + 1000);
    }

    const endpoint = new URL(options.url);
    if (options.schemaVersion != null && options.schemaVersion !== "") {
      endpoint.searchParams.set("schema_version", options.schemaVersion);
    }

    const protocolParts = [
      options.authToken != null ? `auth=${options.authToken}` : null,
      `room=${options.room}`,
      options.schemaVersion != null && options.schemaVersion !== ""
        ? `schema_version=${options.schemaVersion}`
        : null,
    ].filter((part): part is string => part != null);

    const socket = new WebSocket(endpoint.toString(), [
      btoa(protocolParts.join(",")).replace(/=/g, ""),
    ]);
    socket.binaryType = "arraybuffer";

    socket.addEventListener("message", (e: MessageEvent<ArrayBuffer>) => {
      this.#markSyncing();
      void this.#processEvent(new Uint8Array(e.data));
    });

    socket.addEventListener("open", () => {
      this.#onStatus("connected");
      if (this.#onReady) {
        this.#onReady();
      }
    });

    socket.addEventListener("error", () => {
      this.#onStatus("error");
    });

    socket.addEventListener("close", () => {
      if (!this.#closed) {
        this.#onStatus("disconnected");
      }
    });

    this.#socket = socket;
    return socket;
  }

  #markSyncing() {
    this.#onStatus("syncing");
    if (this.#idleTimer) {
      clearTimeout(this.#idleTimer);
    }
    this.#idleTimer = setTimeout(() => {
      if (!this.#closed && this.#socket?.readyState === WebSocket.OPEN) {
        this.#onStatus("connected");
      }
    }, SYNC_IDLE_MS);
  }

  #processEvent = async (data: Uint8Array) => {
    const msg = decode(data);
    switch (msg._tag) {
      case tags.AnnouncePresence:
      case tags.RejectChanges:
        throw new Error(`Unexpected event: ${msg._tag}`);
      case tags.Changes:
        if (this.onChangesReceived) {
          await this.onChangesReceived(msg);
        }
        return;
      case tags.StartStreaming:
        if (this.#hadStartStream) {
          if (this.onResetStream) {
            await this.onResetStream(msg);
          }
        } else {
          this.#hadStartStream = true;
          if (this.onStartStreaming) {
            await this.onStartStreaming(msg);
          }
        }
        return;
    }
  };

  announcePresence(msg: AnnouncePresence): void {
    this.#socket!.send(encode(msg));
  }

  sendChanges(msg: Changes): "reconnecting" | "buffer-full" | "sent" {
    if (this.#socket!.readyState !== WebSocket.OPEN) {
      this.#onStatus("connecting");
      return "reconnecting";
    }
    if (this.#socket!.bufferedAmount > 1024 * 1024 * 5) {
      return "buffer-full";
    }
    this.#socket!.send(encode(msg));
    this.#markSyncing();
    return "sent";
  }

  rejectChanges(msg: RejectChanges): void {
    this.#socket!.send(encode(msg));
  }

  close() {
    this.#closed = true;
    if (this.#idleTimer) {
      clearTimeout(this.#idleTimer);
    }
    this.#socket?.close();
    if (this.#keepAliveInterval) {
      clearInterval(this.#keepAliveInterval);
    }
    this.#onStatus("disconnected");
  }
}
