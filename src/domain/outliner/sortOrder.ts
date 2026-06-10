export function sanitizeSortOrder(
  value: number,
  fallback = Date.now(),
): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }
  return value;
}

export function computeFractionalSortOrder(
  prevOrder: number | null,
  nextOrder: number | null,
): number {
  let newOrder: number;

  if (prevOrder === null && nextOrder !== null) {
    newOrder = nextOrder / 2;
  } else if (nextOrder === null && prevOrder !== null) {
    newOrder = prevOrder + 100;
  } else if (prevOrder !== null && nextOrder !== null) {
    newOrder = (prevOrder + nextOrder) / 2.0;
  } else {
    newOrder = 0;
  }

  return sanitizeSortOrder(newOrder);
}
