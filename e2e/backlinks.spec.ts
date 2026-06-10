import { expect, test } from "@playwright/test";
import {
  blockRows,
  focusEmptyBlock,
  todayBlockTree,
  waitForAppReady,
} from "./helpers/app";
import { sel } from "./helpers/selectors";

test.describe("Backlinks E2E", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.goto("/");
    await waitForAppReady(page);
  });

  test("linked references appear on the target page after wiki link save", async ({
    page,
  }) => {
    const tree = todayBlockTree(page);
    await focusEmptyBlock(page);

    await page.keyboard.type("See [[BacklinkTarget]]", { delay: 30 });
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    const wikiLink = blockRows(tree).first().locator("[data-wiki-link]").first();
    await expect(wikiLink).toContainText("BacklinkTarget", { timeout: 10_000 });
    await wikiLink.click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: "BacklinkTarget" }).click();
    await expect(page.getByRole("heading", { name: "Linked References" })).toBeVisible();

    const referenceTree = page.getByRole("heading", { name: "Linked References" })
      .locator("xpath=following::div[@data-testid='block-tree'][1]");
    await expect(referenceTree.locator(sel.row)).toContainText("BacklinkTarget");
  });
});
