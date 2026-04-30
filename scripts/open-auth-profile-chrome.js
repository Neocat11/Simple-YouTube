const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const extensionPath = path.resolve(__dirname, "..");
const userDataDir = path.resolve(extensionPath, ".playwright-user-profile");
const targetUrl = process.argv[2] || "https://www.youtube.com/";

const chromeCandidates = [
  process.env.CHROME_PATH,
  path.join(process.env.ProgramFiles || "", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env["ProgramFiles(x86)"] || "", "Google", "Chrome", "Application", "chrome.exe"),
  path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe")
].filter(Boolean);

const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));

if (!chromePath) {
  console.error("Google Chrome was not found. Set CHROME_PATH to chrome.exe and retry.");
  process.exit(1);
}

fs.mkdirSync(userDataDir, { recursive: true });

const child = spawn(
  chromePath,
  [
    `--user-data-dir=${userDataDir}`,
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
    "--no-first-run",
    "--no-default-browser-check",
    targetUrl
  ],
  {
    detached: true,
    stdio: "ignore"
  }
);

child.unref();

console.log(`Opened ${targetUrl}`);
console.log(`Chrome: ${chromePath}`);
console.log(`Profile directory: ${userDataDir}`);

