#!/usr/bin/env node
/**
 * After `tauri build` on macOS, copies the generated DMG to
 * website/public/releases/PureMac.{version}.dmg and refreshes website/public/download.json.
 * Also refreshes website/public/icon.png from bundle artwork for the landing favicon.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const tauriConfPath = path.join(root, "src-tauri", "tauri.conf.json");
const websiteDir = path.join(root, "website");
const releasesDir = path.join(websiteDir, "public", "releases");
const iconSrc = path.join(root, "src-tauri", "icons", "128x128.png");
const iconDest = path.join(websiteDir, "public", "icon.png");

function readVersion() {
  const raw = fs.readFileSync(tauriConfPath, "utf8");
  const { version } = JSON.parse(raw);
  if (!version || typeof version !== "string") {
    throw new Error("Missing version in src-tauri/tauri.conf.json");
  }
  return version;
}

function pickDmg(filenames) {
  const score = (name) => {
    const n = name.toLowerCase();
    if (n.includes("universal")) return 4;
    if (n.includes("aarch64") || n.includes("arm64")) return 3;
    if (n.includes("x86_64") || n.includes("x64")) return 2;
    return 1;
  };
  return [...filenames].sort((a, b) => score(b) - score(a))[0];
}

function syncIcon() {
  if (!fs.existsSync(iconSrc)) return;
  fs.mkdirSync(path.dirname(iconDest), { recursive: true });
  fs.copyFileSync(iconSrc, iconDest);
  console.info(`Copied favicon icon → ${path.relative(root, iconDest)}`);
}

function main() {
  const version = readVersion();
  syncIcon();

  const bundleDmgDir = path.join(
    root,
    "src-tauri",
    "target",
    "release",
    "bundle",
    "dmg",
  );

  fs.mkdirSync(releasesDir, { recursive: true });

  let dmgs = [];
  if (fs.existsSync(bundleDmgDir)) {
    dmgs = fs
      .readdirSync(bundleDmgDir)
      .filter((f) => f.endsWith(".dmg"));
  }

  const outName = `PureMac.${version}.dmg`;
  const outPath = path.join(releasesDir, outName);

  let copiedFrom = null;
  if (dmgs.length) {
    const srcName = pickDmg(dmgs);
    const srcPath = path.join(bundleDmgDir, srcName);
    fs.copyFileSync(srcPath, outPath);
    copiedFrom = srcName;
    console.info(
      `Copied release DMG (${srcName}) → ${path.relative(root, outPath)}`,
    );
  } else {
    console.warn(
      "No DMG found under src-tauri/target/release/bundle/dmg — skipped DMG copy. " +
        "Build with `pnpm tauri:build` on macOS with bundling enabled to produce one.",
    );
  }

  const downloadMeta = {
    version,
    file: outName,
    builtFrom: copiedFrom,
  };
  fs.writeFileSync(
    path.join(websiteDir, "public", "download.json"),
    JSON.stringify(downloadMeta, null, 2) + "\n",
    "utf8",
  );
  console.info(`Wrote website/public/download.json (version ${version})`);
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
