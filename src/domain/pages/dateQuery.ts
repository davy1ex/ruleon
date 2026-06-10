import { isDatePage } from "./PageRegistry";

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function inferDateTitleFromQuery(query: string): string | null {
  const trimmed = query.trim();
  if (trimmed === "") {
    return null;
  }

  if (isDatePage(trimmed)) {
    return trimmed;
  }

  const isoLike = trimmed.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (isoLike) {
    const year = Number(isoLike[1]);
    const month = Number(isoLike[2]);
    const day = isoLike[3] ? Number(isoLike[3]) : 1;
    const candidate = `${isoLike[1]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return isValidDateParts(year, month, day) ? candidate : null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 6) {
    return null;
  }

  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = digits.length >= 8 ? Number(digits.slice(6, 8)) : 1;
  const candidate = `${digits.slice(0, 4)}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return isValidDateParts(year, month, day) ? candidate : null;
}
