import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const core = require("../src/core.js");

const fixtureDir = path.resolve("tests", "fixtures", "youtube");
const fixtures = [
  {
    file: "search-video-renderer.html",
    kind: "video",
    titleSelector: "a#video-title, a.ytLockupMetadataViewModelTitle"
  },
  {
    file: "search-shorts-lockup.html",
    kind: "shorts",
    titleSelector: 'a[href^="/shorts/"]'
  },
  {
    file: "watch-video-lockup.html",
    kind: "video",
    titleSelector: "a.ytLockupMetadataViewModelTitle"
  },
  {
    file: "watch-shorts-lockup.html",
    kind: "shorts",
    titleSelector: 'a[href^="/shorts/"]'
  }
];

describe("captured YouTube fixtures", () => {
  test.each(fixtures)("detects thumbnail media in $file without selecting metadata", ({ file, kind, titleSelector }) => {
    const dom = loadFixture(file);
    const document = dom.window.document;

    const processed = core.markProcessed(document.body);
    const thumbnailContainers = core.getThumbnailContainers(document.body);
    const thumbnailMedia = core.getThumbnailMedia(document.body);
    const title = document.querySelector(titleSelector);
    const channelAvatar = document.querySelector("#channel-thumbnail img, .ytSpecAvatarShapeImage");

    expect(processed).toBeGreaterThan(0);
    expect(thumbnailContainers.length).toBeGreaterThan(0);
    expect(thumbnailMedia.length).toBeGreaterThan(0);
    expect(title).toBeTruthy();

    if (channelAvatar) {
      expect(thumbnailMedia).not.toContain(channelAvatar);
    }

    if (kind === "shorts") {
      expect(document.querySelector("[data-simple-youtube-shorts='true']")).toBeTruthy();
    }
  });
});

function loadFixture(file) {
  const html = fs.readFileSync(path.join(fixtureDir, file), "utf8");
  return new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: "https://www.youtube.com/"
  });
}
