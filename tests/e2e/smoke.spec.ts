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
  await expect(page.locator('.node[data-type="skill"]')).toHaveClass(/is-hidden/);
});

test("phone connection reveals a hidden group", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "phone");
  await page.goto("/");
  await page.locator('.node[data-id="mendix"]').click();
  await page.getByRole("button", { name: /SSO and sessions/ }).click();
  await expect(page.locator('.node[data-id="sso-sessions"]')).not.toHaveClass(/is-hidden/);
});

test("say hi builds a RosterJoy mailto", async ({ page }) => {
  await page.goto("/");
  expect(await page.locator("html").innerHTML()).not.toContain(ADDRESS);

  await page.addInitScript(() => {
    Object.defineProperty(window, "__mailto", { value: "", writable: true });
  });
  await page.goto("/");
  await page.evaluate(() => {
    const assign = window.location.assign.bind(window.location);
    window.location.assign = (url: string | URL) => {
      (window as unknown as { __mailto: string }).__mailto = String(url);
      if (String(url).startsWith("mailto:")) return;
      assign(url);
    };
  });
  await page.getByRole("button", { name: "Say hi" }).click();
  await page.locator('input[value="RosterJoy"]').check();
  await page.locator('input[name="name"]').fill("Ada");
  await page.locator("textarea[name=note]").fill("Hello");
  await page.getByRole("button", { name: "Open mail" }).click();
  const mailto = await page.evaluate(() => (window as unknown as { __mailto: string }).__mailto);
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

test("address is absent before click", async ({ page }) => {
  await page.goto("/");
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  expect(html).not.toContain(ADDRESS);
  expect(html).not.toContain("mailto:");
});
