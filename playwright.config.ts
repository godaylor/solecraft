import { defineConfig, devices } from '@playwright/test'

const deployedBaseUrl = process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: deployedBaseUrl ?? 'http://127.0.0.1:32601',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: deployedBaseUrl
    ? undefined
    : {
        command: 'npm run preview -- --host 127.0.0.1 --port 32601',
        url: 'http://127.0.0.1:32601',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
