import { describe, expect, it } from "vitest";
import { extractLinksAndTags } from "./linksParser";

describe("extractLinksAndTags", () => {
  it("extracts wiki links normalized to lowercase", () => {
    const result = extractLinksAndTags("Изучаю [[Реактивность]] и [[ Архитектура ]]");

    expect(result.links).toEqual(["реактивность", "архитектура"]);
    expect(result.tags).toEqual([]);
  });

  it("extracts hashtags normalized to lowercase", () => {
    const result = extractLinksAndTags("Теги #JS и #react-native");

    expect(result.links).toEqual([]);
    expect(result.tags).toEqual(["js", "react-native"]);
  });

  it("deduplicates repeated links and tags", () => {
    const result = extractLinksAndTags("[[Page]] [[PAGE]] #tag #Tag");

    expect(result.links).toEqual(["page"]);
    expect(result.tags).toEqual(["tag"]);
  });
});
