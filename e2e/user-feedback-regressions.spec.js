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
        titleStartsAfterAvatar: Boolean(titleRect && titleRect.left > rect.left + 40),
        thumbnailSpaceVisible: Boolean(thumbnailRect && thumbnailStyle && thumbnailStyle.display !== "none" && thumbnailRect.width > 30 && thumbnailRect.height > 30)
      };
    });

    expect(result.titleVisible).toBe(true);
    expect(result.metadataBelowTitle).toBe(true);
    expect(result.titleStartsAfterAvatar).toBe(true);
    expect(result.thumbnailSpaceVisible).toBe(false);
    expect(result.rowHeight).toBeGreaterThan(50);
    expect(result.rowHeight).toBeLessThan(170);
    expect(result.rowWidth).toBeGreaterThan(500);
  } finally {
    await context.close();
  }
});

test("home rich shelf show more preserves collapsed hidden items and expands on click", async () => {
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

    const shelf = page.locator("ytd-rich-shelf-renderer").first();
    await expect(shelf).toBeVisible({ timeout: 45_000 });
    await shelf.scrollIntoViewIfNeeded();

    const before = await shelf.evaluate((element) => {
      const items = Array.from(element.querySelectorAll("ytd-rich-item-renderer"));
      const visible = items.filter((item) => {
        const rect = item.getBoundingClientRect();
        return getComputedStyle(item).display !== "none" && rect.width > 0 && rect.height > 0;
      });
      const hidden = items.filter((item) => item.hasAttribute("hidden"));
      const button = element.querySelector(".expand-collapse-button button");
      const buttonRect = button?.getBoundingClientRect();
      return {
        total: items.length,
        visible: visible.length,
        hidden: hidden.length,
        buttonVisible: Boolean(buttonRect && buttonRect.width > 0 && buttonRect.height > 0)
      };
    });

    expect(before.total).toBeGreaterThan(before.visible);
    expect(before.hidden).toBeGreaterThan(0);
    expect(before.buttonVisible).toBe(true);

    const clicked = await shelf.evaluate((element) => {
      const moreLabel = "\u3082\u3063\u3068\u898b\u308b";
      const buttons = Array.from(element.querySelectorAll(".expand-collapse-button button"));
      const button = buttons.find((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return candidate.getAttribute("aria-label")?.includes(moreLabel) && rect.width > 0 && rect.height > 0;
      });
      button?.click();
      return Boolean(button);
    });

    expect(clicked).toBe(true);
    await page.waitForTimeout(500);

    const after = await shelf.evaluate((element) => {
      const items = Array.from(element.querySelectorAll("ytd-rich-item-renderer"));
      return items.filter((item) => {
        const rect = item.getBoundingClientRect();
        return getComputedStyle(item).display !== "none" && rect.width > 0 && rect.height > 0;
      }).length;
    });

    expect(after).toBeGreaterThan(before.visible);

    const collapsed = await shelf.evaluate(async (element) => {
      const lessLabel = "\u4e00\u90e8\u3092\u8868\u793a";
      const buttons = Array.from(element.querySelectorAll(".expand-collapse-button button"));
      const button = buttons.find((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return candidate.getAttribute("aria-label")?.includes(lessLabel) && rect.width > 0 && rect.height > 0;
      });
      button?.click();
      await new Promise((resolve) => setTimeout(resolve, 500));

      const items = Array.from(element.querySelectorAll("ytd-rich-item-renderer"));
      return {
        clicked: Boolean(button),
        visible: items.filter((item) => {
          const rect = item.getBoundingClientRect();
          return getComputedStyle(item).display !== "none" && rect.width > 0 && rect.height > 0;
        }).length
      };
    });

    expect(collapsed.clicked).toBe(true);
    expect(collapsed.visible).toBeLessThan(after);
    expect(collapsed.visible).toBe(before.visible);
  } finally {
    await context.close();
  }
});

test("search playlist cards hide collection thumbnail stacks", async () => {
  const context = await launchWithExtension();
  try {
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/results?search_query=playlist&sp=EgIQAw%253D%253D", { waitUntil: "domcontentloaded" });
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
      expect(width).toBeGreaterThan(900);
      expect(width).toBeLessThanOrEqual(1120);
    }
  } finally {
    await context.close();
  }
});

test("channel videos and live tabs let titles and menus follow the widened row", async () => {
  const context = await launchWithExtension();
  try {
    const page = await context.newPage();

    for (const url of ["https://www.youtube.com/@YouTube/videos", "https://www.youtube.com/@YouTube/streams"]) {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const row = page.locator('ytd-rich-item-renderer:has(a[href^="/watch"])').first();
      await expect(row).toBeVisible({ timeout: 45_000 });
      const result = await row.evaluate((item) => {
        const rowRect = item.getBoundingClientRect();
        const title = item.querySelector("#video-title, h3 a, .ytLockupMetadataViewModelTitle");
        const textContainer = item.querySelector("#details, .ytLockupViewModelMetadata, .ytLockupMetadataViewModelTextContainer");
        const menus = Array.from(item.querySelectorAll("#menu, ytd-menu-renderer, .ytLockupMetadataViewModelMenuButton"))
          .filter((node) => {
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && rect.right > rowRect.left + rowRect.width / 2;
          });
        const menuRect = menus
          .map((node) => node.getBoundingClientRect())
          .sort((a, b) => b.right - a.right)[0];
        const titleRect = title?.getBoundingClientRect();
        const textContainerRect = textContainer?.getBoundingClientRect();

        return {
          rowWidth: rowRect.width,
          titleLeftOffset: titleRect ? titleRect.left - rowRect.left : 999,
          textContainerWidth: textContainerRect?.width || 0,
          menuRightGap: menuRect ? rowRect.right - menuRect.right : null
        };
      });

      expect(result.rowWidth).toBeGreaterThan(900);
      expect(result.titleLeftOffset).toBeLessThan(24);
      expect(result.textContainerWidth).toBeGreaterThan(700);
      if (result.menuRightGap !== null) {
        expect(result.menuRightGap).toBeLessThan(520);
      }
    }
  } finally {
    await context.close();
  }
});

test("legacy channel video rows remove the hidden thumbnail column", async ({ page }) => {
  await page.setContent(`
    <!doctype html>
    <html class="simple-youtube-enabled simple-youtube-page-channel simple-youtube-channel-tab-videos">
      <head></head>
      <body>
        <ytd-rich-grid-renderer>
          <div id="contents">
            <ytd-rich-item-renderer style="display:block;width:860px;">
              <div id="content">
                <a id="thumbnail" href="/watch?v=abc" style="display:block;width:260px;height:146px;"></a>
                <div id="details" style="margin-left:260px;">
                  <h3><a id="video-title" href="/watch?v=abc">LoL - sample channel upload title that should start at the row edge</a></h3>
                  <ytd-video-meta-block>
                    <div id="metadata-line">2.3万回視聴 ・ 1日前</div>
                  </ytd-video-meta-block>
                </div>
                <ytd-menu-renderer id="menu">⋮</ytd-menu-renderer>
              </div>
            </ytd-rich-item-renderer>
          </div>
        </ytd-rich-grid-renderer>
      </body>
    </html>
  `);
  await page.addStyleTag({ path: path.resolve(__dirname, "..", "src", "content.css") });

  const result = await page.locator("ytd-rich-item-renderer").evaluate((row) => {
    const rowRect = row.getBoundingClientRect();
    const titleRect = row.querySelector("#video-title").getBoundingClientRect();
    const thumbnail = row.querySelector("#thumbnail");
    const thumbnailRect = thumbnail.getBoundingClientRect();
    const thumbnailStyle = getComputedStyle(thumbnail);
    return {
      titleOffset: titleRect.left - rowRect.left,
      thumbnailSpaceVisible: thumbnailStyle.display !== "none" && thumbnailRect.width > 30 && thumbnailRect.height > 30
    };
  });

  expect(result.thumbnailSpaceVisible).toBe(false);
  expect(result.titleOffset).toBeLessThan(24);
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
      const gameLabel = "\u30b2\u30fc\u30e0";
      Array.from(document.querySelectorAll("yt-chip-cloud-chip-renderer, button"))
        .find((element) => (element.innerText || "").includes(gameLabel))
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

test("channel releases tab is left outside Simple-YouTube video compaction", async () => {
  const context = await launchWithExtension();
  try {
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/@LofiGirl/releases", { waitUntil: "domcontentloaded" });
    const release = page.locator("ytd-rich-item-renderer").first();
    await expect(release).toBeVisible({ timeout: 45_000 });

    const result = await release.evaluate((item) => {
      const image = item.querySelector("img");
      const imageRect = image?.getBoundingClientRect();
      const imageStyle = image ? getComputedStyle(image) : null;
      const rect = item.getBoundingClientRect();
      return {
        rowWidth: rect.width,
        imageVisible: Boolean(imageRect && imageStyle && imageStyle.visibility !== "hidden" && imageStyle.opacity !== "0" && imageRect.width > 30 && imageRect.height > 30)
      };
    });

    expect(result.imageVisible).toBe(true);
    expect(result.rowWidth).toBeLessThan(500);
  } finally {
    await context.close();
  }
});

test("channel home tab compacts featured shorts instead of leaving thumbnail cards", async () => {
  const context = await launchWithExtension();
  try {
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/@YouTube", { waitUntil: "domcontentloaded" });
    const short = page.locator('ytm-shorts-lockup-view-model:has(a[href^="/shorts/"])').first();
    await expect(short).toBeVisible({ timeout: 45_000 });

    const result = await short.evaluate((item) => {
      const rect = item.getBoundingClientRect();
      const image = item.querySelector("img");
      const imageRect = image?.getBoundingClientRect();
      const imageStyle = image ? getComputedStyle(image) : null;
      return {
        height: rect.height,
        width: rect.width,
        imageVisible: Boolean(imageRect && imageStyle && imageStyle.visibility !== "hidden" && imageStyle.opacity !== "0" && imageRect.width > 30 && imageRect.height > 30)
      };
    });

    expect(result.imageVisible).toBe(false);
    expect(result.height).toBeLessThan(90);
    expect(result.width).toBeGreaterThan(400);
  } finally {
    await context.close();
  }
});

test("channel home tab compacts horizontal video shelves into simple rows", async () => {
  const context = await launchWithExtension();
  try {
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/@LofiGirl", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll("ytd-rich-item-renderer, ytd-grid-video-renderer, yt-lockup-view-model"))
        .some((item) => item.querySelector('a[href*="/watch"]') && item.getBoundingClientRect().width > 0);
    }, null, { timeout: 45_000 });

    const result = await page.evaluate(() => {
      const item = Array.from(document.querySelectorAll("ytd-rich-item-renderer, ytd-grid-video-renderer, yt-lockup-view-model"))
        .find((node) => node.querySelector('a[href*="/watch"]') && node.getBoundingClientRect().width > 0);
      const rect = item.getBoundingClientRect();
      const thumbnail = item.querySelector("ytd-thumbnail, yt-thumbnail-view-model, .ytLockupViewModelContentImage, a#thumbnail");
      const thumbnailRect = thumbnail?.getBoundingClientRect();
      const thumbnailStyle = thumbnail ? getComputedStyle(thumbnail) : null;
      const title = item.querySelector("a#video-title, h3 a, .ytLockupMetadataViewModelTitle");
      const titleRect = title?.getBoundingClientRect();
      return {
        height: rect.height,
        width: rect.width,
        thumbnailSpaceVisible: Boolean(thumbnailRect && thumbnailStyle && thumbnailStyle.display !== "none" && thumbnailRect.width > 30 && thumbnailRect.height > 30),
        titleVisible: Boolean(titleRect && titleRect.width > 120 && titleRect.height > 8)
      };
    });

    expect(result.thumbnailSpaceVisible).toBe(false);
    expect(result.titleVisible).toBe(true);
    expect(result.height).toBeLessThan(130);
    expect(result.width).toBeGreaterThan(400);
    expect(result.width).toBeLessThanOrEqual(900);
  } finally {
    await context.close();
  }
});

test("search result types share the compact result column width", async () => {
  const context = await launchWithExtension();
  try {
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/results?search_query=lofi", { waitUntil: "domcontentloaded" });

    const video = page.locator('ytd-video-renderer:has(a[href^="/watch"])').first();
    await expect(video).toBeVisible({ timeout: 45_000 });
    const videoBox = await video.boundingBox();

    await page.goto("https://www.youtube.com/results?search_query=playlist&sp=EgIQAw%253D%253D", { waitUntil: "domcontentloaded" });
    const playlist = page.locator('yt-lockup-view-model:has(a[href*="list="]), ytd-playlist-renderer:has(a[href*="list="]), ytd-grid-playlist-renderer:has(a[href*="list="])').first();
    await expect(playlist).toBeVisible({ timeout: 45_000 });
    const playlistBox = await playlist.boundingBox();

    expect(videoBox.width).toBeLessThanOrEqual(780);
    expect(playlistBox.width).toBeLessThanOrEqual(780);
    expect(Math.abs(videoBox.width - playlistBox.width)).toBeLessThanOrEqual(80);
  } finally {
    await context.close();
  }
});

test("legacy playlist renderers become single-line simple rows", async () => {
  const context = await launchWithExtension();
  try {
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/results?search_query=playlist&sp=EgIQAw%253D%253D", { waitUntil: "domcontentloaded" });
    const playlist = page.locator('yt-lockup-view-model:has(a[href*="list="]), ytd-playlist-renderer:has(a[href*="list="]), ytd-grid-playlist-renderer:has(a[href*="list="])').first();
    await expect(playlist).toBeVisible({ timeout: 45_000 });

    const result = await playlist.evaluate((item) => {
      const rect = item.getBoundingClientRect();
      const thumbnail = item.querySelector("ytd-thumbnail, yt-thumbnail-view-model, yt-collection-thumbnail-view-model, yt-collections-stack, .ytLockupViewModelContentImage");
      const thumbnailRect = thumbnail?.getBoundingClientRect();
      const thumbnailStyle = thumbnail ? getComputedStyle(thumbnail) : null;
      return {
        height: rect.height,
        thumbnailSpaceVisible: Boolean(thumbnailRect && thumbnailStyle && thumbnailStyle.display !== "none" && thumbnailRect.width > 30 && thumbnailRect.height > 30)
      };
    });

    expect(result.thumbnailSpaceVisible).toBe(false);
    expect(result.height).toBeLessThan(150);
  } finally {
    await context.close();
  }
});
