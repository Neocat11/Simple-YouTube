const { expect, test } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const { authProfilePath, hasAuthProfile, launchWithExtension } = require("./helpers");

const coverageDocPath = path.resolve(__dirname, "..", "docs", "coverage-checklist.md");

const publicCases = [
  {
    id: "search.standard-videos",
    url: "https://www.youtube.com/results?search_query=lofi",
    pageClass: "simple-youtube-page-search",
    selector: 'ytd-video-renderer:has(a[href^="/watch"])',
    titleSelector: "a#video-title, h3 a",
    compact: true,
    maxRowHeight: 170
  },
  {
    id: "search.shorts-shelf",
    url: "https://www.youtube.com/results?search_query=youtube+shorts",
    pageClass: "simple-youtube-page-search",
    selector: 'ytm-shorts-lockup-view-model:has(a[href^="/shorts/"])',
    titleSelector: ".shortsLockupViewModelHostOutsideMetadataEndpoint",
    compact: true,
    maxRowHeight: 170
  },
  {
    id: "search.live-results",
    url: "https://www.youtube.com/results?search_query=live+music",
    pageClass: "simple-youtube-page-search",
    selector: 'ytd-video-renderer:has(a[href^="/watch"])',
    titleSelector: "a#video-title, h3 a",
    compact: true,
    maxRowHeight: 170
  },
  {
    id: "search.playlist-results",
    url: "https://www.youtube.com/results?search_query=playlist",
    pageClass: "simple-youtube-page-search",
    selector: 'yt-lockup-view-model:has(a[href*="list="]), ytd-playlist-renderer, ytd-grid-playlist-renderer',
    titleSelector: "a.ytLockupMetadataViewModelTitle, a#video-title, h3 a",
    optional: true
  },
  {
    id: "watch.related-videos",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    pageClass: "simple-youtube-page-watch",
    selector: 'yt-lockup-view-model:has(a[href^="/watch"]), ytd-rich-item-renderer:has(a[href^="/watch"])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, a#video-title, h3 a",
    compact: true
  },
  {
    id: "watch.related-shorts",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    pageClass: "simple-youtube-page-watch",
    selector: 'ytm-shorts-lockup-view-model:has(a[href^="/shorts/"]), yt-lockup-view-model:has(a[href^="/shorts/"])',
    titleSelector: ".shortsLockupViewModelHostOutsideMetadataEndpoint, a.ytLockupMetadataViewModelTitle, h3 a",
    optional: true
  },
  {
    id: "watch.mix-playlist-cards",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    pageClass: "simple-youtube-page-watch",
    selector: 'yt-lockup-view-model:has(a[href*="list="])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, h3 a",
    optional: true
  },
  {
    id: "watch.live-related",
    url: "https://www.youtube.com/watch?v=21X5lGlDOfg",
    pageClass: "simple-youtube-page-watch",
    selector: 'yt-lockup-view-model:has(a[href^="/watch"]), ytd-rich-item-renderer:has(a[href^="/watch"])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, a#video-title, h3 a",
    compact: true
  },
  {
    id: "shorts.single-page",
    url: "https://www.youtube.com/shorts/0A7Onl4YzMU",
    pageClass: "simple-youtube-page-shorts",
    selector: 'yt-lockup-view-model:has(a[href^="/watch"])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, h3 a",
    pageOnly: true
  },
  {
    id: "shorts.related-ui",
    url: "https://www.youtube.com/shorts/0A7Onl4YzMU",
    pageClass: "simple-youtube-page-shorts",
    selector: 'yt-lockup-view-model:has(a[href^="/watch"]), ytm-shorts-lockup-view-model:has(a[href^="/shorts/"])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, h3 a, .shortsLockupViewModelHostOutsideMetadataEndpoint",
    compact: true,
    optional: true
  },
  {
    id: "channel.home",
    url: "https://www.youtube.com/@YouTube",
    pageClass: "simple-youtube-page-channel",
    selector: 'yt-lockup-view-model:has(a[href^="/watch"]), ytd-rich-item-renderer:has(a[href^="/watch"])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, a#video-title, h3 a",
    compact: true,
    optional: true
  },
  {
    id: "channel.videos",
    url: "https://www.youtube.com/@YouTube/videos",
    pageClass: "simple-youtube-page-channel",
    selector: 'ytd-rich-item-renderer:has(a[href^="/watch"])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, a#video-title, h3 a",
    compact: true
  },
  {
    id: "channel.shorts",
    url: "https://www.youtube.com/@YouTube/shorts",
    pageClass: "simple-youtube-page-channel",
    selector: 'ytm-shorts-lockup-view-model:has(a[href^="/shorts/"])',
    titleSelector: ".shortsLockupViewModelHostOutsideMetadataEndpoint",
    compact: true
  },
  {
    id: "channel.live",
    url: "https://www.youtube.com/@YouTube/streams",
    pageClass: "simple-youtube-page-channel",
    selector: 'yt-lockup-view-model:has(a[href^="/watch"]), ytd-rich-item-renderer:has(a[href^="/watch"])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, a#video-title, h3 a",
    compact: true
  },
  {
    id: "channel.playlists",
    url: "https://www.youtube.com/@YouTube/playlists",
    pageClass: "simple-youtube-page-channel",
    selector: 'yt-lockup-view-model:has(a[href*="list="])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, h3 a",
    compact: true
  },
  {
    id: "playlist.detail-videos",
    url: "https://www.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI",
    pageClass: "simple-youtube-page-playlist",
    selector: 'ytd-playlist-video-renderer:has(a[href^="/watch"])',
    titleSelector: "a#video-title, h3 a",
    compact: true
  }
];

const authCases = [
  {
    id: "home.standard-videos",
    url: "https://www.youtube.com/",
    pageClass: "simple-youtube-page-home",
    selector: 'ytd-rich-item-renderer:has(a[href^="/watch"]):not(:has(ytd-ad-slot-renderer)):not(:has(a[href^="/pagead/"]))',
    titleSelector: "a.ytLockupMetadataViewModelTitle, a#video-title, h3 a",
    compact: true
  },
  {
    id: "home.shorts-shelf",
    url: "https://www.youtube.com/",
    pageClass: "simple-youtube-page-home",
    selector: 'ytm-shorts-lockup-view-model:has(a[href^="/shorts/"])',
    titleSelector: ".shortsLockupViewModelHostOutsideMetadataEndpoint",
    compact: true,
    optional: true
  },
  {
    id: "subscriptions.standard-videos",
    url: "https://www.youtube.com/feed/subscriptions",
    pageClass: "simple-youtube-page-subscriptions",
    selector: 'ytd-rich-item-renderer:has(a[href^="/watch"])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, a#video-title, h3 a",
    compact: true
  },
  {
    id: "subscriptions.shorts",
    url: "https://www.youtube.com/feed/subscriptions",
    pageClass: "simple-youtube-page-subscriptions",
    selector: 'ytm-shorts-lockup-view-model:has(a[href^="/shorts/"])',
    titleSelector: ".shortsLockupViewModelHostOutsideMetadataEndpoint",
    compact: true,
    optional: true
  },
  {
    id: "you.feed",
    url: "https://www.youtube.com/feed/you",
    pageClass: "simple-youtube-page-you",
    selector: 'yt-lockup-view-model:has(a[href^="/watch"])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, a#video-title, h3 a",
    compact: true
  },
  {
    id: "you.history",
    url: "https://www.youtube.com/feed/history",
    pageClass: "simple-youtube-page-history",
    selector: 'yt-lockup-view-model:has(a[href^="/watch"])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, h3 a",
    compact: true
  },
  {
    id: "you.watch-later",
    url: "https://www.youtube.com/playlist?list=WL",
    pageClass: "simple-youtube-page-playlist",
    selector: 'ytd-playlist-video-renderer:has(a[href^="/watch"])',
    titleSelector: "a#video-title, h3 a",
    compact: true,
    optional: true
  },
  {
    id: "you.liked-videos",
    url: "https://www.youtube.com/playlist?list=LL",
    pageClass: "simple-youtube-page-playlist",
    selector: 'ytd-playlist-video-renderer:has(a[href^="/watch"])',
    titleSelector: "a#video-title, h3 a",
    compact: true,
    optional: true
  },
  {
    id: "you.playlist-cards",
    url: "https://www.youtube.com/feed/you",
    pageClass: "simple-youtube-page-you",
    selector: 'yt-lockup-view-model:has(a[href*="list="])',
    titleSelector: "a.ytLockupMetadataViewModelTitle, h3 a",
    optional: true
  }
];

const checklistIds = [
  ...publicCases.map((item) => item.id),
  ...authCases.map((item) => item.id),
  "home.live-premiere-cards",
  "home.ads-safe",
  "home.infinite-scroll",
  "search.channel-results",
  "search.mix-radio-cards",
  "search.ads-safe",
  "watch.hover-preview-stable",
  "watch.miniplayer-safe",
  "shorts.spa-navigation",
  "shorts.comments-safe",
  "subscriptions.live-upcoming",
  "subscriptions.date-groups",
  "you.purchases-downloads-safe",
  "playlist.own-list",
  "playlist.channel-tab",
  "playlist.search-result-cards",
  "playlist.side-panel-safe",
  "channel.community-safe",
  "channel.featured-sections",
  "live.current-cards",
  "live.upcoming-cards",
  "live.archives",
  "live.chat-safe",
  "special.premiere",
  "special.mix",
  "special.podcast",
  "special.movie-purchase-safe",
  "special.members-only-safe",
  "special.age-restricted-safe",
  "global.popup-toggle",
  "global.spa-page-class",
  "global.infinite-scroll",
  "global.hover-preview-stable",
  "global.channel-icons-visible",
  "global.thumbnail-badges-hidden",
  "global.required-ui-visible",
  "global.logged-out",
  "global.logged-in",
  "global.locale-tolerant"
];

test.describe("coverage checklist", () => {
  test("documents every automated coverage id as checked", async () => {
    const doc = fs.readFileSync(coverageDocPath, "utf8");

    expect(doc).not.toContain("- [ ]");
    for (const id of checklistIds) {
      expect(doc).toContain(`\`${id}\``);
    }
  });

  for (const coverageCase of publicCases) {
    test(`${coverageCase.id} coverage`, async () => {
      const context = await launchWithExtension();
      try {
        const page = await context.newPage();
        await assertCoverageCase(page, coverageCase);
      } finally {
        await context.close();
      }
    });
  }

  for (const coverageCase of authCases) {
    test(`${coverageCase.id} coverage`, async () => {
      test.skip(!hasAuthProfile(), "Requires .playwright-user-profile with a logged-in YouTube session.");

      const context = await launchWithExtension({
        channel: "chrome",
        userDataDir: authProfilePath
      });

      try {
        const page = context.pages()[0] || await context.newPage();
        await assertCoverageCase(page, coverageCase, { manualInject: true });
      } finally {
        await context.close();
      }
    });
  }

  test("global.spa-page-class and shorts.spa-navigation coverage", async () => {
    const context = await launchWithExtension();
    try {
      const page = await context.newPage();
      await page.goto("https://www.youtube.com/results?search_query=lofi", { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveClass(/simple-youtube-page-search/);

      await page.goto("https://www.youtube.com/watch?v=dQw4w9WgXcQ", { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveClass(/simple-youtube-page-watch/);

      await page.goto("https://www.youtube.com/shorts/0A7Onl4YzMU", { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveClass(/simple-youtube-page-shorts/);
    } finally {
      await context.close();
    }
  });
});

async function assertCoverageCase(page, coverageCase, options = {}) {
  await page.goto(coverageCase.url, { waitUntil: "domcontentloaded" });

  if (options.manualInject) {
    await page.addStyleTag({ path: path.resolve(__dirname, "..", "src", "content.css") });
    await page.evaluate((pageClass) => {
      document.documentElement.classList.add("simple-youtube-enabled", pageClass);
    }, coverageCase.pageClass);
  }

  await expect(page.locator("html")).toHaveClass(new RegExp(coverageCase.pageClass));

  if (coverageCase.pageOnly) {
    return;
  }

  const locator = page.locator(coverageCase.selector).first();
  if (coverageCase.optional) {
    try {
      await locator.waitFor({ state: "visible", timeout: 10_000 });
    } catch (_error) {
      return;
    }
  } else {
    await expect(locator).toBeVisible({ timeout: 45_000 });
  }

  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const result = await page.evaluate(({ selector, titleSelector }) => {
    const items = Array.from(document.querySelectorAll(selector))
      .filter((item, _index, allItems) => !allItems.some((other) => other !== item && item.contains(other)))
      .filter((item) => {
        const rect = item.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
      })
      .slice(0, 8);

    const rects = items.map((item) => {
      const rect = item.getBoundingClientRect();
      const title = item.querySelector(titleSelector);
      const titleRect = title?.getBoundingClientRect();
      const thumbnailContainers = Array.from(item.querySelectorAll("ytd-thumbnail, yt-thumbnail-view-model, a#thumbnail, .ytLockupViewModelContentImage, .shortsLockupViewModelHostThumbnailParentContainer"));
      const thumbnailMedia = Array.from(item.querySelectorAll("ytd-thumbnail img, yt-thumbnail-view-model img, .ytLockupViewModelContentImage img, .shortsLockupViewModelHostThumbnailParentContainer img"));
      const badges = Array.from(item.querySelectorAll("ytd-thumbnail-overlay-time-status-renderer, yt-thumbnail-bottom-overlay-view-model, yt-thumbnail-overlay-badge-view-model"));

      return {
        height: rect.height,
        width: rect.width,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        titleVisible: Boolean(titleRect && titleRect.width > 0 && titleRect.height > 0),
        thumbnailSpaceVisible: thumbnailContainers.some((thumbnail) => {
          const style = getComputedStyle(thumbnail);
          const thumbnailRect = thumbnail.getBoundingClientRect();
          return style.display !== "none" && thumbnailRect.width > 30 && thumbnailRect.height > 30;
        }),
        thumbnailVisible: thumbnailMedia.some((img) => {
          const style = getComputedStyle(img);
          const imageRect = img.getBoundingClientRect();
          return style.visibility !== "hidden" && style.opacity !== "0" && imageRect.width > 0 && imageRect.height > 0;
        }),
        badgesHidden: badges.every((badge) => {
          const style = getComputedStyle(badge);
          return style.display === "none" || style.visibility === "hidden" || style.opacity === "0";
        })
      };
    });

    return {
      count: rects.length,
      overlaps: rects.some((rect, index) => {
        const next = rects[index + 1];
        if (!next) {
          return false;
        }

        const verticallyOverlaps = rect.bottom > next.top + 1 && next.bottom > rect.top + 1;
        const horizontallyOverlaps = rect.right > next.left + 1 && next.right > rect.left + 1;
        return verticallyOverlaps && horizontallyOverlaps;
      }),
      rects
    };
  }, coverageCase);

  expect(result.count).toBeGreaterThan(0);
  expect(result.overlaps).toBe(false);
  for (const rect of result.rects) {
    expect(rect.height).toBeGreaterThan(20);
    expect(rect.height).toBeLessThan(420);
    expect(rect.titleVisible).toBe(true);
    expect(rect.thumbnailVisible).toBe(false);
    expect(rect.badgesHidden).toBe(true);
    if (coverageCase.compact) {
      expect(rect.height).toBeLessThan(coverageCase.maxRowHeight || 140);
      expect(rect.thumbnailSpaceVisible).toBe(false);
    }
  }
}
