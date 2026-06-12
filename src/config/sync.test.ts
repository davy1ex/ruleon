import { describe, expect, it } from "vitest";
import {
  buildSyncDeepLink,
  getInboxApiUrl,
  getSyncUrlValidationError,
  parseSyncDeepLink,
  parseSyncWebSocketUrl,
} from "./sync";

describe("parseSyncWebSocketUrl", () => {
  it("accepts ws and wss URLs", () => {
    expect(parseSyncWebSocketUrl("ws://localhost:8080/sync")?.href).toBe(
      "ws://localhost:8080/sync",
    );
    expect(parseSyncWebSocketUrl("wss://example.com/sync")?.href).toBe(
      "wss://example.com/sync",
    );
  });

  it("rejects invalid and non-WebSocket URLs without throwing", () => {
    expect(parseSyncWebSocketUrl("not a url")).toBeNull();
    expect(parseSyncWebSocketUrl("http://localhost:8080/sync")).toBeNull();
    expect(parseSyncWebSocketUrl("")).toBeNull();
  });
});

describe("getSyncUrlValidationError", () => {
  it("returns null for valid URLs", () => {
    expect(getSyncUrlValidationError("ws://localhost:8080/sync")).toBeNull();
  });

  it("returns a message for invalid URLs", () => {
    expect(getSyncUrlValidationError("%%%")).toMatch(/Invalid WebSocket URL/);
  });
});

describe("getInboxApiUrl", () => {
  it("returns null instead of throwing for invalid URLs", () => {
    expect(getInboxApiUrl("%%%")).toBeNull();
  });
});

describe("parseSyncDeepLink", () => {
  const url = "ws://192.168.1.227:8080/sync";
  const key = "1e8a56f2ff795758e8435b256ffb8f5b1b3cbbef6f9ba032";
  const encoded = buildSyncDeepLink(url, key);

  it("parses standard ruleon://sync links", () => {
    expect(parseSyncDeepLink(encoded)).toEqual({ url, apiKey: key });
  });

  it("parses ruleon://sync/ with trailing slash", () => {
    expect(parseSyncDeepLink(encoded.replace("ruleon://sync?", "ruleon://sync/?"))).toEqual({
      url,
      apiKey: key,
    });
  });

  it("parses ruleon:///sync triple-slash links", () => {
    expect(parseSyncDeepLink(encoded.replace("ruleon://sync?", "ruleon:///sync?"))).toEqual({
      url,
      apiKey: key,
    });
  });

  it("rejects unrelated schemes", () => {
    expect(parseSyncDeepLink("https://example.com/sync?url=x&key=y")).toBeNull();
  });
});
