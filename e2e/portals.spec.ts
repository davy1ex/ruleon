import { expect, test } from "@playwright/test";
import {
  blockRows,
  focusEmptyBlock,
  openBlockEditor,
  todayBlockTree,
  waitForAppReady,
} from "./helpers/app";
import { sel } from "./helpers/selectors";

test.describe("Query portals E2E", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("portal shows open tasks linking to target page", async ({ page }) => {
    const tree = todayBlockTree(page);
    await focusEmptyBlock(page);

    await page.keyboard.type("See [[PortalTarget]]", { delay: 20 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    const rows = blockRows(tree);
    await expect(rows).toHaveCount(2);

    await rows.nth(0).click();
    await page.keyboard.press("Control+Enter");
    await expect(rows.nth(0).locator(sel.taskCheckbox)).toBeVisible();

    const portalEditor = await openBlockEditor(rows.nth(1), page);
    await portalEditor.fill("{{query: PortalTarget}}");
    await page.waitForTimeout(800);

    const portal = tree.locator("[data-query-portal]").first();
    await expect(portal).toBeVisible({ timeout: 10_000 });
    await expect(portal).toContainText("PortalTarget");
    await expect(portal.locator("[data-testid='portal-block-row']")).toContainText(
      "PortalTarget",
    );
    await expect(
      portal.locator("[data-testid='portal-block-row']").locator(sel.taskCheckbox),
    ).toBeVisible();
  });
});
