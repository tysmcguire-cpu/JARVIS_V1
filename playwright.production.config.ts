import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/production",
  outputDir: "test-results-production",
  use: { baseURL: "http://127.0.0.1:3101" },
  webServer: { command: "pnpm start --hostname 127.0.0.1 --port 3101", url: "http://127.0.0.1:3101/login", reuseExistingServer: false,
    env: { JARVIS_DEMO_MODE: "true", NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "", JARVIS_OWNER_ID: "" } }
});
