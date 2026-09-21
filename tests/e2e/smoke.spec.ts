import { expect, test } from "@playwright/test";

const ADDRESS = "hello@calwatson.com";

test("page loads without console errors or third-party requests", async ({ page }) => {
  const errors: string[] = [];
  const foreign: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("request", (req) => {
    const url = req.url();
    if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost") || url.startsWith("data:")) {
      return;
    }
    foreign.push(url);
  });
  await page.goto("/");
  await expect(page.locator(".node")).toHaveCount(45, { timeout: 10_000 });
  expect(errors, errors.join("\n")).toEqual([]);
  expect(foreign, foreign.join("\n")).toEqual([]);
});

test("node visibility and Mendix panel", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".node")).toHaveCount(45);
  if (testInfo.project.name === "phone") {
    await expect(page.locator(".node:not(.is-hidden)")).toHaveCount(23);
  }

  await page.locator('.node[data-id="mendix"]').click();
  await expect(page.locator("#panel")).toContainText("Senior Solutions Architect");
  await page.keyboard.press("Escape");
  await expect(page.locator("#panel")).toContainText("How to read this");
});

test("skills chip hides skill nodes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "phone", "skills already hidden on phones");
  await page.goto("/");
  const chip = page.getByRole("button", { name: /Skills/ });
  await chip.click();
  await expect(page.locator('.node[data-type="skill"].is-hidden')).toHaveCount(13);
});

test("phone connection reveals a hidden group", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "phone");
  await page.goto("/");
  await page.locator('.node[data-id="mendix"]').click();
  await page.getByRole("button", { name: /SSO and sessions/ }).click();
  await expect(page.locator('.node[data-id="sso-sessions"]')).not.toHaveClass(/is-hidden/);
});

test("say hi builds a RosterJoy mailto", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "__mailto", { value: "", writable: true, configurable: true });
    const original = Location.prototype.assign;
    Location.prototype.assign = function assign(url: string | URL) {
      (window as unknown as { __mailto: string }).__mailto = String(url);
      if (String(url).startsWith("mailto:")) return;
      return original.call(this, url);
    };
  });
  await page.goto("/");
  expect(await page.locator("html").innerHTML()).not.toContain(ADDRESS);

  await page.locator("#say-hi").click();
  await expect(page.locator("#contact")).toBeVisible();
  await page.getByRole("radio", { name: "RosterJoy" }).click({ force: true });
  await page.locator('input[name="name"]').fill("Ada");
  await page.locator("textarea[name=note]").fill("Hello");
  await page.getByRole("button", { name: "Open mail" }).click();
  const mailto = await page.locator("[data-mailto-probe]").getAttribute("href");
  expect(mailto).toContain("mailto:");
  expect(mailto).toContain(encodeURIComponent("calwatson.com: RosterJoy"));
});

test("no horizontal overflow", async ({ page }) => {
  for (const width of [360, 390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(overflow, `width ${width}`).toBe(true);
  }
});

test("shell and svg fill the viewport height", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".graph-svg")).toBeVisible();
  const sizes = await page.evaluate(() => {
    const app = document.querySelector(".app");
    const canvas = document.querySelector(".canvas");
    const svg = document.querySelector(".graph-svg");
    if (!app || !canvas || !svg) return null;
    const appBox = app.getBoundingClientRect();
    const canvasBox = canvas.getBoundingClientRect();
    const svgBox = svg.getBoundingClientRect();
    return {
      innerHeight: window.innerHeight,
      appHeight: appBox.height,
      canvasHeight: canvasBox.height,
      svgHeight: svgBox.height,
      leftoverBelowApp: window.innerHeight - appBox.bottom,
      svgGap: Math.abs(svgBox.height - canvasBox.height),
    };
  });
  expect(sizes).not.toBeNull();
  expect(sizes!.leftoverBelowApp).toBeLessThanOrEqual(1);
  expect(Math.abs(sizes!.appHeight - sizes!.innerHeight)).toBeLessThanOrEqual(1);
  expect(sizes!.svgGap).toBeLessThanOrEqual(1);
  expect(sizes!.canvasHeight).toBeGreaterThan(200);
});

test("graph refits when viewport height changes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "phone", "phone project already uses a tall viewport");
  await page.goto("/");
  await expect(page.locator(".node")).toHaveCount(45);
  await page.waitForTimeout(700);

  await page.setViewportSize({ width: 1440, height: 620 });
  await page.waitForTimeout(500);
  const short = await page.evaluate(() => {
    const canvas = document.querySelector(".canvas");
    const svg = document.querySelector(".graph-svg");
    const nodes = [...document.querySelectorAll(".node")];
    if (!canvas || !svg || !nodes.length) return null;
    const svgBox = svg.getBoundingClientRect();
    let minY = Infinity;
    let maxY = -Infinity;
    for (const node of nodes) {
      const box = node.getBoundingClientRect();
      minY = Math.min(minY, box.top);
      maxY = Math.max(maxY, box.bottom);
    }
    return {
      innerHeight: window.innerHeight,
      appHeight: document.querySelector(".app")?.getBoundingClientRect().height ?? 0,
      svgHeight: svgBox.height,
      canvasHeight: canvas.getBoundingClientRect().height,
      spaceBelow: svgBox.bottom - maxY,
      spaceAbove: minY - svgBox.top,
      fillY: (maxY - minY) / svgBox.height,
    };
  });
  expect(short).not.toBeNull();
  expect(short!.appHeight).toBeCloseTo(short!.innerHeight, 0);
  expect(Math.abs(short!.svgHeight - short!.canvasHeight)).toBeLessThanOrEqual(1);
  expect(short!.spaceBelow).toBeGreaterThanOrEqual(-8);
  expect(short!.spaceAbove).toBeGreaterThanOrEqual(-8);
  expect(short!.fillY).toBeGreaterThan(0.55);

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.waitForTimeout(500);
  const tall = await page.evaluate(() => {
    const svg = document.querySelector(".graph-svg");
    const canvas = document.querySelector(".canvas");
    const nodes = [...document.querySelectorAll(".node")];
    if (!canvas || !svg || !nodes.length) return null;
    const svgBox = svg.getBoundingClientRect();
    let minY = Infinity;
    let maxY = -Infinity;
    for (const node of nodes) {
      const box = node.getBoundingClientRect();
      minY = Math.min(minY, box.top);
      maxY = Math.max(maxY, box.bottom);
    }
    return {
      innerHeight: window.innerHeight,
      appHeight: document.querySelector(".app")?.getBoundingClientRect().height ?? 0,
      svgHeight: svgBox.height,
      canvasHeight: canvas.getBoundingClientRect().height,
      spaceBelow: svgBox.bottom - maxY,
      fillY: (maxY - minY) / svgBox.height,
    };
  });
  expect(tall).not.toBeNull();
  expect(tall!.appHeight).toBeCloseTo(tall!.innerHeight, 0);
  expect(Math.abs(tall!.svgHeight - tall!.canvasHeight)).toBeLessThanOrEqual(1);
  expect(tall!.svgHeight).toBeGreaterThan(short!.svgHeight + 200);
  expect(tall!.spaceBelow).toBeGreaterThanOrEqual(-8);
  expect(tall!.fillY).toBeGreaterThan(0.55);
});

test("address is absent before click", async ({ page }) => {
  await page.goto("/");
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  expect(html).not.toContain(ADDRESS);
  expect(html).not.toContain("mailto:");
});
