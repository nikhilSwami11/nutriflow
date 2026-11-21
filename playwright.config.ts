import { defineConfig, devices } from "@playwright/test";

// Own port + empty Supabase vars: e2e runs on the seeded in-memory repos, never the real project.
export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    env: { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" },
  },
  use: { baseURL: "http://localhost:3100" },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
