const { expect, test } = require("@playwright/test");
const { getExtensionId, launchWithExtension } = require("./helpers");

test("hides thumbnails on live YouTube search results and watch recommendations", async () => {
  const context = await launchWithExtension();

  try {
    const extensionId = await getExtensionId(context);
    await ensureEnabled(context, extensionId);

    const page = await context.newPage();

    await page.goto("https://www.youtube.com/results?search_query=lofi", { waitUntil: "domcontentloaded" });
    await dismissConsentIfPresent(page);

    const searchVideo = page.locator('ytd-video-renderer:has(a[href^="/watch"])').first();
    await expect(searchVideo).toBeVisible({ timeout: 45_000 });
    await expect(searchVideo.locator("a#video-title, a.ytLockupMetadataViewModelTitle").first()).toBeVisible();
    await expect(searchVideo.locator("ytd-thumbnail img, a#thumbnail img").first()).toHaveCSS("visibility", "hidden");

    const searchShorts = page.locator('ytm-shorts-lockup-view-model:has(a[href^="/shorts/"])').first();
    await expect(searchShorts).toBeVisible({ timeout: 45_000 });
    await expect(searchShorts.locator('a[href^="/shorts/"]').last()).toBeVisible();
    await expect(searchShorts.locator("yt-thumbnail-view-model img, .shortsLockupViewModelHostThumbnailParentContainer img").first()).toHaveCSS("visibility", "hidden");

    await page.goto("https://www.youtube.com/watch?v=dQw4w9WgXcQ", { waitUntil: "domcontentloaded" });
    await dismissConsentIfPresent(page);

    const player = page.locator("#movie_player, video").first();
    await expect(player).toBeVisible({ timeout: 45_000 });

    const watchVideo = page.locator('yt-lockup-view-model:has(a[href^="/watch"])').first();
    await expect(watchVideo).toBeVisible({ timeout: 45_000 });
    await expect(watchVideo.locator("a.ytLockupMetadataViewModelTitle, h3 a").first()).toBeVisible();
    await expect(watchVideo.locator(".ytLockupViewModelContentImage img, yt-thumbnail-view-model img").first()).toHaveCSS("visibility", "hidden");
  } finally {
    await context.close();
  }
});

async function ensureEnabled(context, extensionId) {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);

  const toggle = popup.locator("#enabled-toggle");
  if (!(await toggle.isChecked())) {
    await popup.getByText("SIMPLE YOUTUBEを有効化？").click();
  }

  await popup.close();
}

async function dismissConsentIfPresent(page) {
  const buttons = [
    page.getByRole("button", { name: /Accept all|I agree|同意|すべて同意/i }),
    page.getByText(/Accept all|I agree|同意|すべて同意/i)
  ];

  for (const button of buttons) {
    try {
      if (await button.first().isVisible({ timeout: 1_000 })) {
        await button.first().click();
        return;
      }
    } catch (_error) {
      // Keep looking for other consent shapes.
    }
  }
}

