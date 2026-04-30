const path = require("node:path");
const { chromium } = require("@playwright/test");

const extensionPath = path.resolve(__dirname, "..");

async function launchWithExtension() {
  return chromium.launchPersistentContext("", {
    channel: "chromium",
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
  extensionPath,
  getExtensionId,
  launchWithExtension
};

