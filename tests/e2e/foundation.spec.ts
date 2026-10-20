import { test, expect } from "@playwright/test";
test("private routes fail closed without auth configuration", async ({ page }) => {
  await page.goto("/finances");
  await expect(page).toHaveURL(/\/login\?status=configuration/);
  await expect(page.getByRole("status")).toContainText("Setup required");
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  await page.screenshot({ path: `test-results/${test.info().project.name}-login.png`, fullPage: true });
});
test("synthetic shell, navigation and settings work on all viewports", async ({ page }, testInfo) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "JARVIS", exact: true })).toBeVisible();
  await expect(page.getByText("Demo data", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  for (const link of await page.getByRole("navigation", { name: "Workspace modules" }).getByRole("link").all()) {
    const bounds = await link.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  }
  await page.screenshot({ path: `test-results/${testInfo.project.name}-dashboard.png`, fullPage: true, animations: "disabled" });
  await page.getByRole("navigation", { name: "Workspace modules" }).getByRole("link", { name: "Open Settings", exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/settings$/, { timeout: 20000 });
  await expect(page.getByRole("heading", { name: "Notification preferences" })).toBeVisible();
  await expect(page.getByText("Disabled · inactive time 08:00")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  for (const note of await page.locator(".settings-note").all()) {
    const bounds = await note.boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height - 20);
  }
  await page.screenshot({ path: `test-results/${testInfo.project.name}-settings.png`, fullPage: true });
  await page.setViewportSize({ width: 1024, height: 600 });
  for (const note of await page.locator(".settings-note").all()) {
    const bounds = await note.boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(580);
  }
});
test("demo does not accept unknown modules", async ({ page }) => {
  const response = await page.goto("/demo/not-a-module");
  expect(response?.status()).toBe(404);
});

test("orbital controls support keyboard selection, motion preferences and navigation", async ({ page }) => {
  await page.goto("/demo");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const modules = page.getByRole("navigation", { name: "Workspace modules" });
  await expect(modules.getByRole("link")).toHaveCount(10);
  await modules.getByRole("link", { name: "Open Finances", exact: true }).focus();
  await expect(page.locator(".hub-selection")).toContainText("Finances");
  await page.getByRole("button", { name: "Pause interface animations" }).click();
  await expect(page.getByRole("button", { name: "Resume interface animations" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".flowing-core canvas")).toHaveAttribute("data-motion", "paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Resume interface animations" }).click();
  await expect(page.locator(".flowing-core canvas")).toHaveAttribute("data-motion", "paused");
  await modules.getByRole("link", { name: "Open Projects", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Add projects", exact: true })).toBeVisible();
});

test("flowing core animates and the workspace enforces the desktop canvas", async ({ page }) => {
  await page.goto("/demo");
  const canvas = page.locator(".flowing-core canvas");
  await expect(canvas).toHaveAttribute("data-motion", "flowing");
  const firstFrame = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL());
  await expect.poll(() => canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).not.toBe(firstFrame);
  await page.setViewportSize({ width: 1024, height: 600 });
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const link of await page.getByRole("navigation", { name: "Workspace modules" }).getByRole("link").all()) {
    const bounds = await link.boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(600);
  }
  await page.setViewportSize({ width: 800, height: 600 });
  await expect(page.getByRole("heading", { name: "A little more room." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Workspace modules" })).not.toBeVisible();
});
