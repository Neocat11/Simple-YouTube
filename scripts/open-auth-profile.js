const path = require("node:path");
const { chromium } = require("@playwright/test");

const extensionPath = path.resolve(__dirname, "..");
const userDataDir = path.resolve(extensionPath, ".playwright-user-profile");
const targetUrl = process.argv[2] || "https://www.youtube.com/";

async function main() {
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    headless: false,
    viewport: { width: 1440, height: 1000 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

  console.log(`Opened ${targetUrl}`);
  console.log(`Profile directory: ${userDataDir}`);
  console.log("Log in using the opened browser window. Press Ctrl+C here after you are done.");

  await new Promise(() => {});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

