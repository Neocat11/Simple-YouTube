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
