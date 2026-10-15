import { test, expect } from "@playwright/test";
test("private routes fail closed without auth configuration", async ({ page }) => {
  await page.goto("/finances");
  await expect(page).toHaveURL(/\/login\?status=configuration/);
  await expect(page.getByRole("status")).toContainText("Setup required");
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: `test-results/${test.info().project.name}-login.png`, fullPage: true });
});
test("synthetic shell, navigation and settings work on all viewports", async ({ page }, testInfo) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "Command Center." })).toBeVisible();
  await expect(page.getByText("DEMONSTRATION MODE", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-dashboard.png`, fullPage: true, animations: "disabled" });
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("complementary", { name: "Primary navigation" }).getByRole("link", { name: "Settings", exact: true }).click();
  } else {
    await page.getByRole("navigation", { name: "Workspace modules" }).getByRole("link", { name: "Open Settings", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Initial notification defaults" })).toBeVisible();
  await expect(page.getByText("Disabled · inactive time 08:00")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-settings.png`, fullPage: true });
});
test("demo does not accept unknown modules", async ({ page }) => {
  const response = await page.goto("/demo/not-a-module");
  expect(response?.status()).toBe(404);
});

test("orbital controls support keyboard selection, motion preferences and navigation", async ({ page }) => {
  if (test.info().project.name === "mobile") await page.setViewportSize({ width: 320, height: 760 });
  await page.goto("/demo");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const modules = page.getByRole("navigation", { name: "Workspace modules" });
  await expect(modules.getByRole("link")).toHaveCount(10);
  await modules.getByRole("link", { name: "Open Finances", exact: true }).focus();
  await expect(page.locator(".hub-selection")).toContainText("Finances");
  await page.getByRole("button", { name: "Pause interface animations" }).click();
  await expect(page.getByRole("button", { name: "Resume interface animations" })).toHaveAttribute("aria-pressed", "true");
  expect(await page.locator(".hub-scanner").evaluate(element => getComputedStyle(element).animationPlayState)).toBe("paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.locator(".hub-scanner").evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  await modules.getByRole("link", { name: "Open Projects", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await expect(page.getByText("Planned · Phase 2", { exact: true })).toBeVisible();
});
