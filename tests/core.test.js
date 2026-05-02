import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const core = require("../src/core.js");

describe("SimpleYouTubeCore", () => {
  test("identifies Shorts URLs", () => {
    expect(core.isShortsUrl("/shorts/abc123")).toBe(true);
    expect(core.isShortsUrl("https://www.youtube.com/shorts/abc123")).toBe(true);
    expect(core.isShortsUrl("/watch?v=abc123")).toBe(false);
    expect(core.isShortsUrl("/playlist?list=abc123")).toBe(false);
  });

  test("defaults to enabled when no stored value exists", () => {
    expect(core.getStoredEnabled({})).toBe(true);
    expect(core.getStoredEnabled({ enabled: false })).toBe(false);
    expect(core.getStoredEnabled({ enabled: true })).toBe(true);
  });

  test("toggles the document enabled class", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");

    core.setEnabledClass(dom.window.document, true);
    expect(dom.window.document.documentElement.classList.contains(core.ENABLED_CLASS)).toBe(true);

    core.setEnabledClass(dom.window.document, false);
    expect(dom.window.document.documentElement.classList.contains(core.ENABLED_CLASS)).toBe(false);
  });

  test("classifies YouTube page types", () => {
    expect(core.getPageType(new URL("https://www.youtube.com/"))).toBe("home");
    expect(core.getPageType(new URL("https://www.youtube.com/results?search_query=lofi"))).toBe("search");
    expect(core.getPageType(new URL("https://www.youtube.com/watch?v=abc123"))).toBe("watch");
    expect(core.getPageType(new URL("https://www.youtube.com/shorts/abc123"))).toBe("shorts");
    expect(core.getPageType(new URL("https://www.youtube.com/feed/subscriptions"))).toBe("subscriptions");
    expect(core.getPageType(new URL("https://www.youtube.com/feed/you"))).toBe("you");
    expect(core.getPageType(new URL("https://www.youtube.com/feed/history"))).toBe("history");
    expect(core.getPageType(new URL("https://www.youtube.com/@example/videos"))).toBe("channel");
    expect(core.getPageType(new URL("https://www.youtube.com/playlist?list=abc123"))).toBe("playlist");
  });

  test("sets a single page type class", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");

    core.setPageTypeClass(dom.window.document, new URL("https://www.youtube.com/results?search_query=lofi"));
    expect(dom.window.document.documentElement.classList.contains("simple-youtube-page-search")).toBe(true);

    core.setPageTypeClass(dom.window.document, new URL("https://www.youtube.com/watch?v=abc123"));
    expect(dom.window.document.documentElement.classList.contains("simple-youtube-page-search")).toBe(false);
    expect(dom.window.document.documentElement.classList.contains("simple-youtube-page-watch")).toBe(true);
  });

  test("marks processable renderers without touching channel avatars", () => {
    const dom = new JSDOM(`
      <ytd-rich-item-renderer>
        <a id="thumbnail" href="/watch?v=video">
          <img class="thumb" src="https://i.ytimg.com/vi/video/hqdefault.jpg">
        </a>
        <a id="avatar-link" href="/@channel">
          <img class="avatar" src="avatar.jpg">
        </a>
        <a id="video-title-link" href="/watch?v=video">A useful title</a>
      </ytd-rich-item-renderer>
    `);

    const count = core.markProcessed(dom.window.document.body);
    const renderer = dom.window.document.querySelector("ytd-rich-item-renderer");
    const avatar = dom.window.document.querySelector(".avatar");

    expect(count).toBe(1);
    expect(renderer.getAttribute(core.PROCESSED_ATTR)).toBe("true");
    expect(avatar.getAttribute(core.PROCESSED_ATTR)).toBeNull();
  });

  test("marks Shorts renderers", () => {
    const dom = new JSDOM(`
      <ytd-rich-item-renderer>
        <a id="thumbnail" href="/shorts/short1">
          <img src="https://i.ytimg.com/vi/short1/oar2.jpg">
        </a>
        <a id="video-title-link" href="/shorts/short1">Short title</a>
      </ytd-rich-item-renderer>
    `);

    core.markProcessed(dom.window.document.body);

    expect(dom.window.document.querySelector("ytd-rich-item-renderer").getAttribute("data-simple-youtube-shorts")).toBe("true");
  });
});
