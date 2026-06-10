import { describe, expect, it } from "vitest";
import { QUERY_PORTAL_PATTERN } from "./queryPortalSyntax";

describe("QUERY_PORTAL_PATTERN", () => {
  it("matches new portal syntax for the whole block", () => {
    const match = "{{query: Target Page}}".match(QUERY_PORTAL_PATTERN);
    expect(match?.[1]).toBe("Target Page");
  });

  it("allows whitespace after query prefix", () => {
    const match = "{{query:  Foo}}".match(QUERY_PORTAL_PATTERN);
    expect(match?.[1]).toBe("Foo");
  });

  it("allows portal syntax without colon", () => {
    const match = "{{query todo}}".match(QUERY_PORTAL_PATTERN);
    expect(match?.[1]).toBe("todo");
  });

  it("rejects wiki link syntax alone", () => {
    expect("[[Target]]".match(QUERY_PORTAL_PATTERN)).toBeNull();
  });

  it("rejects legacy nested-bracket portal syntax", () => {
    expect("{{query: [[Target]]}}".match(QUERY_PORTAL_PATTERN)).toBeNull();
  });

  it("rejects incomplete portal syntax", () => {
    expect("{{query: Target".match(QUERY_PORTAL_PATTERN)).toBeNull();
  });

  it("requires pattern to cover the whole block", () => {
    expect("prefix {{query: Target}}".match(QUERY_PORTAL_PATTERN)).toBeNull();
    expect("{{query: Target}} suffix".match(QUERY_PORTAL_PATTERN)).toBeNull();
  });
});
