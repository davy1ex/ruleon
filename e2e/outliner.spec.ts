import { expect, test } from "@playwright/test";
import {
  blockRows,
  focusEmptyBlock,
  focusedEditor,
  openBlockEditor,
  pressAtBlockStart,
  resetBrowserStorage,
  todayBlockTree,
  waitForAppReady,
} from "./helpers/app";
import { sel } from "./helpers/selectors";

test.describe("Outliner E2E", () => {
  test.beforeEach(async ({ context, page }) => {
    await resetBrowserStorage(context);
    await waitForAppReady(page);
  });

  test("Flow 1: Enter splits block into two independent siblings", async ({
    page,
  }) => {
    const tree = todayBlockTree(page);
    const editor = await focusEmptyBlock(page);

    await editor.fill("Hello");
    await page.keyboard.press("Enter");

    const rows = blockRows(tree);
    await expect(rows).toHaveCount(2);

    await expect(rows.nth(0)).toContainText("Hello");
    await expect(rows.nth(1)).toHaveText("");

    const firstId = await rows.nth(0).getAttribute("data-block-id");
    const secondId = await rows.nth(1).getAttribute("data-block-id");
    expect(firstId).toBeTruthy();
    expect(secondId).toBeTruthy();
    expect(firstId).not.toBe(secondId);
  });

  test("Flow 2: Tab indents block (depth + parent_id)", async ({ page }) => {
    const tree = todayBlockTree(page);
    const editor = await focusEmptyBlock(page);

    await editor.fill("Parent");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Child");

    const rows = blockRows(tree);
    await expect(rows).toHaveCount(2);

    const parentRow = rows.nth(0);
    const childRow = rows.nth(1);
    const parentId = await parentRow.getAttribute("data-block-id");
    expect(parentId).toBeTruthy();

    await openBlockEditor(childRow, page);
    await page.keyboard.press("Tab");

    await expect(childRow).toHaveAttribute("data-depth", "1");
    await expect(childRow).toHaveAttribute("data-parent-id", parentId!);
  });

  test("Flow 3: Backspace at block start merges with previous block", async ({
    page,
  }) => {
    const tree = todayBlockTree(page);
    const editor = await focusEmptyBlock(page);

    await editor.pressSequentially("Hello");
    await page.keyboard.press("Enter");

    const rows = blockRows(tree);
    await expect(rows).toHaveCount(2);

    const secondEditor = await openBlockEditor(rows.nth(1), page);
    await secondEditor.pressSequentially("World");
    await expect(focusedEditor(page)).toHaveValue("World");

    await pressAtBlockStart(focusedEditor(page));
    await focusedEditor(page).press("Backspace");

    await expect(blockRows(tree)).toHaveCount(1);
    await expect(blockRows(tree).first()).toContainText("HelloWorld");
  });
});
