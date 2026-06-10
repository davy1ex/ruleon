export type PortalFilter = "todo" | "all";

export function portalCacheKey(
  target: string,
  filter: PortalFilter,
): string {
  return `${target.trim().toLowerCase()}:${filter}`;
}
