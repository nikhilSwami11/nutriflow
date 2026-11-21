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
  use: {
    baseURL: "http://localhost:3100",
    permissions: ["camera"],
    // a fake camera, so the capture flow can be tested for real
    launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] },
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
