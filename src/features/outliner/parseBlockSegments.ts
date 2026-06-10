const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

export type BlockSegment =
  | { type: "text"; value: string }
  | { type: "link"; name: string; display: string };

export function parseBlockSegments(content: string): BlockSegment[] {
  const segments: BlockSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(LINK_PATTERN)) {
    const rawName = match[1];
    const start = match.index ?? 0;
    if (!rawName) {
      continue;
    }

    if (start > lastIndex) {
      segments.push({
        type: "text",
        value: content.slice(lastIndex, start),
      });
    }

    segments.push({
      type: "link",
      name: rawName.trim(),
      display: rawName,
    });
    lastIndex = start + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }

  return segments;
}
