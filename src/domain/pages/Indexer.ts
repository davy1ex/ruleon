import type { PageListItem } from "../outliner/types";
import { isDatePage, normalizePageTitle } from "./PageRegistry";

export interface IndexedPageListItem extends PageListItem {
  title: string;
}

export function indexPage(page: PageListItem): IndexedPageListItem {
  const title = normalizePageTitle(page.content, page.id);
  return {
    ...page,
    content: title,
    title,
  };
}

export function partitionPages(pages: PageListItem[]): {
  dailyNotes: IndexedPageListItem[];
  regularPages: IndexedPageListItem[];
} {
  const indexed = pages.map(indexPage);
  const dailyNotes = indexed
    .filter((page) => isDatePage(page.title))
    .sort((left, right) => right.title.localeCompare(left.title));
  const regularPages = indexed
    .filter((page) => !isDatePage(page.title))
    .sort((left, right) => left.title.localeCompare(right.title));

  return { dailyNotes, regularPages };
}
