const { expect, test } = require("@playwright/test");
const path = require("node:path");
const { authProfilePath, hasAuthProfile, launchWithExtension } = require("./helpers");

test("search video rows keep a readable stacked metadata layout", async () => {
  const context = await launchWithExtension();
  try {
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/results?search_query=lofi", { waitUntil: "domcontentloaded" });
    const firstVideo = page.locator('ytd-video-renderer:has(a[href^="/watch"])').first();
    await expect(firstVideo).toBeVisible({ timeout: 45_000 });

    const result = await firstVideo.evaluate((item) => {
      const rect = item.getBoundingClientRect();
      const title = item.querySelector("a#video-title, h3 a");
      const titleRect = title?.getBoundingClientRect();
      const meta = item.querySelector("ytd-video-meta-block, #metadata-line");
      const metaRect = meta?.getBoundingClientRect();
      const thumbnail = item.querySelector("ytd-thumbnail, a#thumbnail");
      const thumbnailRect = thumbnail?.getBoundingClientRect();
      const thumbnailStyle = thumbnail ? getComputedStyle(thumbnail) : null;
      return {
        rowHeight: rect.height,
        rowWidth: rect.width,
        titleVisible: Boolean(titleRect && titleRect.width > 0 && titleRect.height > 0),
        metadataBelowTitle: Boolean(titleRect && metaRect && metaRect.top >= titleRect.bottom - 1),
        thumbnailSpaceVisible: Boolean(thumbnailRect && thumbnailStyle && thumbnailStyle.display !== "none" && thumbnailRect.width > 30 && thumbnailRect.height > 30)
      };
    });

    expect(result.titleVisible).toBe(true);
    expect(result.metadataBelowTitle).toBe(true);
    expect(result.thumbnailSpaceVisible).toBe(false);
    expect(result.rowHeight).toBeGreaterThan(50);
    expect(result.rowHeight).toBeLessThan(170);
    expect(result.rowWidth).toBeGreaterThan(500);
  } finally {
    await context.close();
  }
});

test("search playlist cards hide collection thumbnail stacks", async () => {
  const context = await launchWithExtension();
  try {
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/results?search_query=playlist", { waitUntil: "domcontentloaded" });
    const playlist = page.locator('yt-lockup-view-model:has(a[href*="list="])').first();
    await expect(playlist).toBeVisible({ timeout: 45_000 });

    const result = await playlist.evaluate((item) => {
      const rect = item.getBoundingClientRect();
      const stack = item.querySelector("yt-collections-stack, yt-collection-thumbnail-view-model, .ytLockupViewModelContentImage");
      const stackRect = stack?.getBoundingClientRect();
      const stackStyle = stack ? getComputedStyle(stack) : null;
      return {
        height: rect.height,
        thumbnailStackVisible: Boolean(stackRect && stackStyle && stackStyle.display !== "none" && stackRect.width > 30 && stackRect.height > 30)
      };
    });

    expect(result.thumbnailStackVisible).toBe(false);
    expect(result.height).toBeLessThan(140);
  } finally {
    await context.close();
  }
});

test("channel videos and live tabs use a wider readable row width", async () => {
  const context = await launchWithExtension();
  try {
    const page = await context.newPage();
    for (const url of ["https://www.youtube.com/@YouTube/videos", "https://www.youtube.com/@YouTube/streams"]) {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const row = page.locator('ytd-rich-item-renderer:has(a[href^="/watch"]), yt-lockup-view-model:has(a[href^="/watch"])').first();
      await expect(row).toBeVisible({ timeout: 45_000 });
      const width = await row.evaluate((item) => item.getBoundingClientRect().width);
      expect(width).toBeGreaterThan(500);
      expect(width).toBeLessThanOrEqual(900);
    }
  } finally {
    await context.close();
  }
});

test("home non-video game or ad cards keep bounded artwork", async () => {
  test.skip(!hasAuthProfile(), "Requires .playwright-user-profile with a logged-in YouTube session.");

  const context = await launchWithExtension({
    channel: "chrome",
    userDataDir: authProfilePath
  });

  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto("https://www.youtube.com/", { waitUntil: "domcontentloaded" });
    await page.addStyleTag({ path: path.resolve(__dirname, "..", "src", "content.css") });
    await page.evaluate(() => document.documentElement.classList.add("simple-youtube-enabled", "simple-youtube-page-home"));
    await page.evaluate(() => {
      Array.from(document.querySelectorAll("yt-chip-cloud-chip-renderer, button"))
        .find((element) => (element.innerText || "").includes("ゲーム"))
        ?.click();
    });
    await page.waitForTimeout(3_000);

    const result = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("ytd-rich-item-renderer"))
        .filter((item) => !item.querySelector('a[href^="/watch"], a[href^="/shorts/"]'))
        .filter((item) => {
          const rect = item.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
        });

      return cards.map((item) => {
        const rect = item.getBoundingClientRect();
        const images = Array.from(item.querySelectorAll("img")).map((image) => {
          const imageRect = image.getBoundingClientRect();
          const style = getComputedStyle(image);
          return {
            width: imageRect.width,
            height: imageRect.height,
            visible: style.visibility !== "hidden" && style.opacity !== "0" && imageRect.width > 0 && imageRect.height > 0
          };
        });
        return {
          width: rect.width,
          height: rect.height,
          visibleImages: images.filter((image) => image.visible)
        };
      });
    });

    for (const card of result) {
      expect(card.width).toBeLessThan(760);
      for (const image of card.visibleImages) {
        expect(image.width).toBeLessThan(760);
      }
    }
  } finally {
    await context.close();
  }
});
