import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e", fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } }],
  webServer: { command: "pnpm dev --hostname 127.0.0.1 --port 3100", url: "http://127.0.0.1:3100/login", reuseExistingServer: false, timeout: 120000,
    env: { JARVIS_TEST_OUTPUT: "true", JARVIS_DEMO_MODE: "true", NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "", JARVIS_OWNER_ID: "" } }
});
