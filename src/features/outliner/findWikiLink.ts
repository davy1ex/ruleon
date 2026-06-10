const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

export function findWikiLinkAtPosition(
  content: string,
  position: number,
): string | null {
  for (const match of content.matchAll(LINK_PATTERN)) {
    const rawName = match[1];
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (!rawName || position < start || position > end) {
      continue;
    }
    return rawName.trim();
  }
  return null;
}

export function isWikiLinkTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("[data-wiki-link]") !== null;
}
