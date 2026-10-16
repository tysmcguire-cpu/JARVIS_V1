import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/production",
  outputDir: "test-results-production",
  use: { baseURL: "http://127.0.0.1:3101" },
  webServer: { command: "pnpm hosted:start", url: "http://127.0.0.1:3101/login", reuseExistingServer: false,
    env: { PORT: "3101", JARVIS_NOTIFICATIONS_ENABLED: "false", TELEGRAM_ENABLED: "false", TELEGRAM_WEBHOOK_SECRET: "", JARVIS_DEMO_MODE: "true", NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "", JARVIS_OWNER_ID: "" } }
});
