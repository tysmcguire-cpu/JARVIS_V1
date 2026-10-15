import { test, expect } from "@playwright/test";
test("production blocks demo even when its environment flag is enabled", async ({ request }) => {
  for (const path of ["/demo", "/demo/settings", "/demo/finances"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain("$1,248.00");
  }
});
test("production private routes fail closed without configured authentication", async ({ request }) => {
  const response = await request.get("/finances", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/login?status=configuration");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
});
