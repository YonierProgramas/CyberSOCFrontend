import { defineConfig } from 'playwright/test';
export default defineConfig({
  testDir: './production',
  timeout: 30000,
  workers: 1,
  use: {
    ...(process.platform === 'win32' ? { channel: 'chrome' } : {}),
    headless: true,
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'node ../scripts/serve-csp.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
