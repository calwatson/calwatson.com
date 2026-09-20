import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = path.join(root, "scripts/og.html");
const outDir = path.join(root, "public");
const distDir = path.join(root, "dist");

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`file://${html}`);
  const png = await page.screenshot({ type: "png" });
  const { writeFile } = await import("node:fs/promises");
  await writeFile(path.join(outDir, "og.png"), png);
  try {
    await mkdir(distDir, { recursive: true });
    await writeFile(path.join(distDir, "og.png"), png);
  } catch {
    // dist may not exist yet during a standalone og run
  }
  await browser.close();
}

void main();
