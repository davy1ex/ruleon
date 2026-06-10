import type { BrowserContext, Locator, Page } from "@playwright/test";
import { sel } from "./selectors";

export async function resetBrowserStorage(context: BrowserContext): Promise<void> {
  await context.clearCookies();
  await context.clearPermissions();
}

export async function clearOriginStorage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();

    if ("databases" in indexedDB) {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(
          (database) =>
            new Promise<void>((resolve, reject) => {
              if (!database.name) {
                resolve();
                return;
              }
              const request = indexedDB.deleteDatabase(database.name);
              request.onerror = () => reject(request.error);
              request.onblocked = () => resolve();
              request.onsuccess = () => resolve();
            }),
        ),
      );
    }

    if (navigator.storage?.getDirectory) {
      const root = await navigator.storage.getDirectory();
      for await (const [name] of root.entries()) {
        await root.removeEntry(name, { recursive: true });
      }
    }
  });
}

export async function waitForAppReady(page: Page): Promise<void> {
  await page.goto("/");
  await clearOriginStorage(page);
  await page.goto("/");
  await page.locator(sel.loading).waitFor({ state: "hidden", timeout: 30_000 });
}

export function todayBlockTree(page: Page): Locator {
  return page.getByTestId("block-tree").first();
}

export function blockRows(tree: Locator): Locator {
  return tree.locator(sel.row);
}

export function focusedEditor(tree: Locator): Locator {
  return tree.locator(sel.editor).first();
}

export async function focusEmptyBlock(page: Page): Promise<Locator> {
  const tree = todayBlockTree(page);
  await tree.waitFor({ state: "visible" });

  const editor = focusedEditor(tree);
  await editor.click();
  return editor;
}

export async function pressAtBlockStart(editor: Locator): Promise<void> {
  await editor.focus();
  await editor.evaluate((element) => {
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
}
