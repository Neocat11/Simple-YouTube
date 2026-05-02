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

test("popup toggle updates an open YouTube page", async () => {
  const context = await launchWithExtension();

  try {
    const extensionId = await getExtensionId(context);
    const youtube = await context.newPage();
    await youtube.goto("https://www.youtube.com/results?search_query=lofi", { waitUntil: "domcontentloaded" });
    await expect(youtube.locator('ytd-video-renderer:has(a[href^="/watch"])').first()).toBeVisible({ timeout: 45_000 });

    await expect(youtube.locator("html")).toHaveClass(/simple-youtube-enabled/);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.getByText("SIMPLE YOUTUBEを有効化？").click();
    await expect(youtube.locator("html")).not.toHaveClass(/simple-youtube-enabled/);

    await popup.getByText("SIMPLE YOUTUBEを有効化？").click();
    await expect(youtube.locator("html")).toHaveClass(/simple-youtube-enabled/);
  } finally {
    await context.close();
  }
});
