const { expect, test } = require("@playwright/test");
const path = require("node:path");
const { authProfilePath, hasAuthProfile, launchWithExtension } = require("./helpers");

const surfaces = [
  {
    name: "search",
    url: "https://www.youtube.com/results?search_query=lofi",
    pageClass: "simple-youtube-page-search",
    itemSelector: 'ytd-video-renderer:has(a[href^="/watch"])',
    titleSelector: "a#video-title, a.ytLockupMetadataViewModelTitle",
    compactList: true,
    maxRowHeight: 170
  },
  {
    name: "search shorts",
    url: "https://www.youtube.com/results?search_query=youtube+shorts",
    pageClass: "simple-youtube-page-search",
    itemSelector: 'ytm-shorts-lockup-view-model:has(a[href^="/shorts/"])',
    titleSelector: ".shortsLockupViewModelHostOutsideMetadataEndpoint",
    compactList: true
  },
  {
    name: "watch",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    pageClass: "simple-youtube-page-watch",
    itemSelector: 'yt-lockup-view-model:has(a[href^="/watch"])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, h3 a",
    compactList: true
  },
  {
    name: "channel videos",
    url: "https://www.youtube.com/@YouTube/videos",
    pageClass: "simple-youtube-page-channel",
    itemSelector: 'ytd-rich-item-renderer:has(a[href^="/watch"])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, a#video-title, h3 a",
    compactList: true
  },
  {
    name: "playlist videos",
    url: "https://www.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI",
    pageClass: "simple-youtube-page-playlist",
    itemSelector: 'ytd-playlist-video-renderer:has(a[href^="/watch"])',
    titleSelector: "a#video-title, h3 a",
    compactList: true
  }
];

test.describe("layout health", () => {
  for (const surface of surfaces) {
    test(`${surface.name} keeps visible rows sane`, async () => {
      const context = await launchWithExtension();

      try {
        const page = await context.newPage();
        await page.goto(surface.url, { waitUntil: "domcontentloaded" });
        const firstItem = page.locator(surface.itemSelector).first();
        await expect(firstItem).toBeVisible({ timeout: 45_000 });
        await firstItem.scrollIntoViewIfNeeded();

        await expect(page.locator("html")).toHaveClass(new RegExp(surface.pageClass));

        const result = await page.evaluate(({ itemSelector, titleSelector }) => {
          const items = Array.from(document.querySelectorAll(itemSelector))
            .filter((item) => {
              const rect = item.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
            })
            .slice(0, 8);

          const rects = items.map((item) => {
            const rect = item.getBoundingClientRect();
            const title = item.querySelector(titleSelector);
            const titleRect = title?.getBoundingClientRect();
            return {
              height: rect.height,
              width: rect.width,
              top: rect.top,
              bottom: rect.bottom,
              titleVisible: Boolean(titleRect && titleRect.width > 0 && titleRect.height > 0),
              thumbnailSpaceVisible: Array.from(item.querySelectorAll("ytd-thumbnail, yt-thumbnail-view-model, a#thumbnail, .ytLockupViewModelContentImage")).some((thumbnail) => {
                const style = getComputedStyle(thumbnail);
                const thumbnailRect = thumbnail.getBoundingClientRect();
                return style.display !== "none" && thumbnailRect.width > 30 && thumbnailRect.height > 30;
              }),
              thumbnailVisible: Array.from(item.querySelectorAll("ytd-thumbnail img, yt-thumbnail-view-model img, .ytLockupViewModelContentImage img")).some((img) => {
                const style = getComputedStyle(img);
                const imageRect = img.getBoundingClientRect();
                return style.visibility !== "hidden" && style.opacity !== "0" && imageRect.width > 0 && imageRect.height > 0;
              })
            };
          });

          const overlaps = rects.some((rect, index) => {
            const next = rects[index + 1];
            return next ? rect.bottom > next.top + 1 : false;
          });

          return {
            count: rects.length,
            overlaps,
            rects
          };
        }, surface);

        expect(result.count).toBeGreaterThan(0);
        expect(result.overlaps).toBe(false);
        for (const rect of result.rects) {
          expect(rect.height).toBeGreaterThan(20);
          expect(rect.height).toBeLessThan(420);
          expect(rect.titleVisible).toBe(true);
          expect(rect.thumbnailVisible).toBe(false);
          if (surface.compactList) {
            expect(rect.height).toBeLessThan(surface.maxRowHeight || 120);
            expect(rect.thumbnailSpaceVisible).toBe(false);
          }
        }
      } finally {
        await context.close();
      }
    });
  }

  test("authenticated home keeps visible rows sane", async () => {
    test.skip(!hasAuthProfile(), "Requires local .playwright-user-profile with a logged-in YouTube session.");

    const context = await launchWithExtension({
      channel: "chrome",
      userDataDir: authProfilePath
    });

    try {
      const page = context.pages()[0] || await context.newPage();
      await page.goto("https://www.youtube.com/", { waitUntil: "domcontentloaded" });
      await page.addStyleTag({ path: path.resolve(__dirname, "..", "src", "content.css") });
      await page.evaluate(() => {
        document.documentElement.classList.add("simple-youtube-enabled", "simple-youtube-page-home");
      });

      const itemSelector = 'ytd-rich-item-renderer:has(a[href^="/watch"]):not(:has(ytd-ad-slot-renderer)):not(:has(a[href^="/pagead/"]))';
      await expect(page.locator(itemSelector).first()).toBeVisible({ timeout: 45_000 });

      const result = await page.evaluate((selector) => {
        const items = Array.from(document.querySelectorAll(selector))
          .filter((item) => {
            const rect = item.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
          })
          .slice(0, 8);

        return items.map((item) => {
          const rect = item.getBoundingClientRect();
          const title = item.querySelector("a.ytLockupMetadataViewModelTitle, a#video-title");
          const titleRect = title?.getBoundingClientRect();
          return {
            height: rect.height,
            width: rect.width,
            titleVisible: Boolean(titleRect && titleRect.width > 0 && titleRect.height > 0),
            thumbnailSpaceVisible: Array.from(item.querySelectorAll("yt-thumbnail-view-model, .ytLockupViewModelContentImage, ytd-thumbnail, a#thumbnail")).some((thumbnail) => {
              const style = getComputedStyle(thumbnail);
              const thumbnailRect = thumbnail.getBoundingClientRect();
              return style.display !== "none" && thumbnailRect.width > 30 && thumbnailRect.height > 30;
            }),
            thumbnailVisible: Array.from(item.querySelectorAll("yt-thumbnail-view-model img, .ytLockupViewModelContentImage img, ytd-thumbnail img")).some((img) => {
              const style = getComputedStyle(img);
              const imageRect = img.getBoundingClientRect();
              return style.visibility !== "hidden" && style.opacity !== "0" && imageRect.width > 0 && imageRect.height > 0;
            })
          };
        });
      }, itemSelector);

      expect(result.length).toBeGreaterThan(0);
      for (const rect of result) {
        expect(rect.height).toBeGreaterThan(40);
        expect(rect.height).toBeLessThan(140);
        expect(rect.titleVisible).toBe(true);
        expect(rect.thumbnailSpaceVisible).toBe(false);
        expect(rect.thumbnailVisible).toBe(false);
      }
    } finally {
      await context.close();
    }
  });
});
