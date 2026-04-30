const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const outputDir = path.resolve(__dirname, "..", "tests", "fixtures", "youtube");
const artifactDir = path.resolve(__dirname, "..", "test-results", "fixture-capture");

const fixtureSpecs = [
  {
    name: "search-video-renderer",
    url: "https://www.youtube.com/results?search_query=lofi",
    selector: 'ytd-video-renderer:has(a[href^="/watch"])'
  },
  {
    name: "search-shorts-lockup",
    url: "https://www.youtube.com/results?search_query=lofi",
    selector: 'ytm-shorts-lockup-view-model:has(a[href^="/shorts/"])'
  },
  {
    name: "watch-video-lockup",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    selector: 'yt-lockup-view-model:has(a[href^="/watch"])'
  },
  {
    name: "watch-shorts-lockup",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    selector: 'ytm-shorts-lockup-view-model:has(a[href^="/shorts/"])'
  }
];

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  await fs.mkdir(artifactDir, { recursive: true });

  const browser = await chromium.launch({
    channel: "chromium",
    headless: process.env.HEADED !== "1"
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  try {
    for (const spec of fixtureSpecs) {
      const html = await captureFixture(page, spec);
      const filePath = path.join(outputDir, `${spec.name}.html`);
      await fs.writeFile(filePath, html, "utf8");
      console.log(`captured ${spec.name}`);
    }
  } finally {
    await browser.close();
  }
}

async function captureFixture(page, spec) {
  await page.goto(spec.url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await dismissConsentIfPresent(page);
  await page.waitForTimeout(4_000);
  await page.waitForFunction(
    (selector) => document.querySelector(selector),
    spec.selector,
    { timeout: 45_000 }
  ).catch(async (error) => {
    await page.screenshot({ path: path.join(artifactDir, `${spec.name}-failed.png`), fullPage: true });
    const bodyText = await page.locator("body").innerText({ timeout: 5_000 }).catch(() => "");
    await fs.writeFile(path.join(artifactDir, `${spec.name}-failed.txt`), bodyText, "utf8");
    throw error;
  });

  return page.locator(spec.selector).first().evaluate((element, metadata) => {
    const clone = element.cloneNode(true);
    sanitizeNode(clone);

    return [
      `<!-- Captured from ${metadata.url} -->`,
      `<!-- Selector: ${metadata.selector} -->`,
      clone.outerHTML,
      ""
    ].join("\n");

    function sanitizeNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const normalized = node.textContent.replace(/\s+/g, " ").trim();
        node.textContent = normalized ? " Sample text " : "";
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      for (const attribute of Array.from(node.attributes)) {
        const name = attribute.name;
        const value = attribute.value;

        if (["src", "srcset", "data-src", "data-thumb", "data-original"].includes(name)) {
          node.setAttribute(name, placeholderForUrl(value));
          continue;
        }

        if (name === "href") {
          node.setAttribute(name, normalizeHref(value));
          continue;
        }

        if (name.startsWith("aria-")) {
          node.setAttribute(name, "Sample text");
          continue;
        }

        if (["alt", "title"].includes(name)) {
          node.setAttribute(name, value ? "Sample text" : "");
          continue;
        }

        if (name.startsWith("data-") && name !== "data-simple-youtube-processed" && name !== "data-simple-youtube-shorts") {
          node.removeAttribute(name);
          continue;
        }

        if (value.length > 140) {
          node.setAttribute(name, "sample");
        }
      }

      Array.from(node.childNodes).forEach(sanitizeNode);
    }

    function normalizeHref(value) {
      try {
        const url = new URL(value, "https://www.youtube.com");
        return `${url.pathname}${url.search ? "?sample=1" : ""}`;
      } catch (_error) {
        return value;
      }
    }

    function placeholderForUrl(value) {
      if (value.includes("yt3.")) {
        return "https://example.invalid/channel-avatar.jpg";
      }

      if (value.includes("/oar2.")) {
        return "https://example.invalid/shorts-thumbnail.jpg";
      }

      return "https://example.invalid/video-thumbnail.jpg";
    }
  }, spec);
}

async function dismissConsentIfPresent(page) {
  const candidates = [
    page.getByRole("button", { name: /Accept all|I agree|同意|すべて同意/i }),
    page.getByText(/Accept all|I agree|同意|すべて同意/i)
  ];

  for (const candidate of candidates) {
    try {
      if (await candidate.first().isVisible({ timeout: 1_000 })) {
        await candidate.first().click();
        await page.waitForTimeout(1_000);
        return;
      }
    } catch (_error) {
      // Continue trying other consent shapes.
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
