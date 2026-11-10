import { defineConfig } from "@playwright/test";

const origin = "http://127.0.0.1:4175";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: origin, locale: "en-US", serviceWorkers: "block" },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4175 --strictPort",
    url: origin,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: "https://flipper-e2e.invalid",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    },
  },
});
