const { expect, test } = require("@playwright/test");
const path = require("node:path");
const { authProfilePath, hasAuthProfile, launchWithExtension } = require("./helpers");

test("hides thumbnails on authenticated YouTube home", async () => {
  test.skip(!hasAuthProfile(), "Requires local .playwright-user-profile with a logged-in YouTube session.");

  const context = await launchWithExtension({
    channel: "chrome",
    userDataDir: authProfilePath
  });

  try {
    const page = context.pages()[0] || await context.newPage();

    await page.goto("https://www.youtube.com/", { waitUntil: "domcontentloaded" });

    const homeVideo = page
      .locator('ytd-rich-item-renderer:has(a[href^="/watch"]):not(:has(ytd-ad-slot-renderer)):not(:has(a[href^="/pagead/"]))')
      .first();
    await expect(homeVideo).toBeVisible({ timeout: 45_000 });
    await page.addStyleTag({ path: path.resolve(__dirname, "..", "src", "content.css") });
    await page.evaluate(() => document.documentElement.classList.add("simple-youtube-enabled"));
    await expect(homeVideo.locator("a.ytLockupMetadataViewModelTitle, a#video-title").first()).toBeVisible();
    await expect(homeVideo.locator(".ytLockupViewModelContentImage img, yt-thumbnail-view-model img, ytd-thumbnail img").first()).toHaveCSS("visibility", "hidden");

    const shortsCard = page.locator(':is(ytd-rich-item-renderer, ytm-shorts-lockup-view-model):has(a[href^="/shorts/"])').first();
    if (await shortsCard.count()) {
      await expect(shortsCard.locator('a[href^="/shorts/"]').last()).toBeVisible();
      await expect(shortsCard.locator(".shortsLockupViewModelHostThumbnailParentContainer img, yt-thumbnail-view-model img").first()).toHaveCSS("visibility", "hidden");
    }
  } finally {
    await context.close();
  }
});
