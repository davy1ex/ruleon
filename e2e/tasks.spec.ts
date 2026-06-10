import { expect, test } from "@playwright/test";
import {
  blockRows,
  focusEmptyBlock,
  todayBlockTree,
  waitForAppReady,
} from "./helpers/app";
import { sel } from "./helpers/selectors";

test.describe("Task status E2E", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("Ctrl+Enter in editor marks block as TODO and shows checkbox", async ({
    page,
  }) => {
    const tree = todayBlockTree(page);
    const editor = await focusEmptyBlock(page);

    await editor.fill("Buy milk");
    await page.keyboard.press("Control+Enter");

    const row = blockRows(tree).first();
    await expect(row.locator(sel.taskCheckbox)).toBeVisible();
    await expect(row.locator(sel.taskCheckbox)).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  test("checkbox click cycles TODO to DONE", async ({ page }) => {
    const tree = todayBlockTree(page);
    const editor = await focusEmptyBlock(page);

    await editor.fill("Buy milk");
    await page.keyboard.press("Control+Enter");

    const row = blockRows(tree).first();
    const checkbox = row.locator(sel.taskCheckbox);
    await checkbox.click();

    await expect(checkbox).toHaveAttribute("aria-checked", "true");
  });

  test("Ctrl+Enter with multi-select toggles all selected blocks", async ({
    page,
  }) => {
    const tree = todayBlockTree(page);
    const editor = await focusEmptyBlock(page);

    await editor.fill("First");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Second");

    const rows = blockRows(tree);
    await expect(rows).toHaveCount(2);

    await rows.nth(0).click({ modifiers: ["Control"] });
    await rows.nth(1).click({ modifiers: ["Control"] });

    await page.keyboard.press("Control+Enter");

    await expect(rows.nth(0).locator(sel.taskCheckbox)).toBeVisible();
    await expect(rows.nth(1).locator(sel.taskCheckbox)).toBeVisible();
  });
});
