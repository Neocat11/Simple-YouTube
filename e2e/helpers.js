const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("@playwright/test");

const extensionPath = path.resolve(__dirname, "..");
const authProfilePath = path.resolve(extensionPath, ".playwright-user-profile");

async function launchWithExtension(options = {}) {
  const userDataDir = options.userDataDir || "";
  const channel = options.channel || "chromium";

  return chromium.launchPersistentContext(userDataDir, {
    channel,
    headless: false,
    viewport: { width: 1440, height: 1000 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });
}

async function getExtensionId(context) {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  return new URL(serviceWorker.url()).host;
}

module.exports = {
  authProfilePath,
  extensionPath,
  getExtensionId,
  hasAuthProfile: () => fs.existsSync(authProfilePath),
  launchWithExtension
};
