import { defineConfig } from 'playwright/test';

const env = {
  VITE_API_BASE_URL: 'https://cybersocbackend.onrender.com',
  VITE_SUPABASE_URL: 'https://cgvjthwobrlzmhmzuuvg.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ejemplo_local_no_real_0000',
  VITE_SIGNUP_MODE: 'open',
  VITE_CONFIRM_SIGNUP_TYPE: 'signup',
};

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    ...(process.platform === 'win32' ? { channel: 'chrome' } : {}),
    headless: true,
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    env,
  },
});
