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
    const homeThumbnail = homeVideo.locator(".ytLockupViewModelContentImage img, yt-thumbnail-view-model img, ytd-thumbnail img").first();
    await expect(homeThumbnail).toHaveCSS("visibility", "hidden");
    await expect(homeVideo.locator(".ytLockupViewModelContentImage, yt-thumbnail-view-model, ytd-thumbnail").first()).toHaveCSS("position", "absolute");
    await homeVideo.hover();
    await expect(homeThumbnail).toHaveCSS("visibility", "visible");

    await expect(homeVideo.locator("yt-thumbnail-bottom-overlay-view-model, ytd-thumbnail-overlay-time-status-renderer").first()).toBeHidden();
  } finally {
    await context.close();
  }
});
