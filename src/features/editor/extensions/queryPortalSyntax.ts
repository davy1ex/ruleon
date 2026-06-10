/**
 * Input/paste DSL: `{{query: Target}}` or `{{query Target}}` — plain target, no `[[...]]`.
 * Optional colon so `{{query todo}}` works; avoids WikiLink input-rule conflicts.
 */
export const QUERY_PORTAL_PATTERN = /^\{\{query\s*:?\s*([^}[\]]+)\}\}$/;

/** TipTap paste rules call `String.matchAll`, which requires the `g` flag. */
export const QUERY_PORTAL_PASTE_PATTERN = /^\{\{query\s*:?\s*([^}[\]]+)\}\}$/g;

/** Legacy syntax kept for normalizing stored content only. */
export const LEGACY_QUERY_PORTAL_PATTERN =
  /^\{\{query\s*:?\s*\[\[([^\]]+)\]\]\s*\}\}$/;

export function parsePortalTarget(text: string): string | null {
  const trimmed = text.trim();
  const match =
    trimmed.match(LEGACY_QUERY_PORTAL_PATTERN) ??
    trimmed.match(QUERY_PORTAL_PATTERN);
  const target = match?.[1]?.trim();
  return target === "" ? null : (target ?? null);
}

export function formatPortalSyntax(target: string): string {
  return `{{query: ${target}}}`;
}
