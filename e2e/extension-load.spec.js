const { expect, test } = require("@playwright/test");
const { getExtensionId, launchWithExtension } = require("./helpers");

test("extension loads and popup renders the MVP toggle", async () => {
  const context = await launchWithExtension();

  try {
    const extensionId = await getExtensionId(context);
    const page = await context.newPage();

    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await expect(page.getByText("SIMPLE YOUTUBEを有効化？")).toBeVisible();

    const toggle = page.locator("#enabled-toggle");
    await expect(toggle).toBeChecked();

    await page.getByText("SIMPLE YOUTUBEを有効化？").click();
    await expect(toggle).not.toBeChecked();

    await page.reload();
    await expect(toggle).not.toBeChecked();

    await page.getByText("SIMPLE YOUTUBEを有効化？").click();
    await expect(toggle).toBeChecked();
  } finally {
    await context.close();
  }
});
