export type PortalFilter = "todo" | "done" | "all";

export function portalCacheKey(
  target: string,
  filter: PortalFilter,
): string {
  return `${target.trim().toLowerCase()}:${filter}`;
}

export function resolvePortalFilter(
  target: string,
  filter: PortalFilter,
): PortalFilter {
  const normalized = target.trim().toLowerCase();
  if (normalized === "completed" || normalized === "done") {
    return "done";
  }
  return filter;
}

export function resolveEffectivePortalFilter(
  target: string,
  filter: PortalFilter,
  pageTitle: string | null | undefined,
): PortalFilter {
  if (pageTitle?.trim().toLowerCase() === "completed") {
    return "done";
  }
  return resolvePortalFilter(target, filter);
}
