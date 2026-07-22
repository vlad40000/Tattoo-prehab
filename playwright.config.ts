import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'on-first-retry' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:3000/api/health', reuseExistingServer: !process.env.CI, timeout: 120_000 },
  projects: [
    { name: 'ipad-portrait', use: { ...devices['iPad Pro 11'], browserName: 'chromium', viewport: { width: 1024, height: 1366 } } },
    { name: 'ipad-landscape', use: { ...devices['iPad Pro 11 landscape'], browserName: 'chromium', viewport: { width: 1366, height: 1024 } } },
  ],
});
