const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;
const TAG_PATTERN = /#([\p{L}\p{N}_-]+)/gu;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function collectMatches(
  content: string,
  pattern: RegExp,
): string[] {
  const results: string[] = [];
  const seen = new Set<string>();

  for (const match of content.matchAll(pattern)) {
    const raw = match[1];
    if (!raw) {
      continue;
    }
    const normalized = normalize(raw);
    if (normalized === "" || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    results.push(normalized);
  }

  return results;
}

export function extractLinksAndTags(content: string): {
  links: string[];
  tags: string[];
} {
  return {
    links: collectMatches(content, LINK_PATTERN),
    tags: collectMatches(content, TAG_PATTERN),
  };
}
