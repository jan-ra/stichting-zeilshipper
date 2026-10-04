import { defineConfig, devices } from '@playwright/test'

// Browser smoke tests against an already-running site. scripts/verify.sh and
// scripts/rehearse-release.sh start the stack and set SITE_URL; this config
// only drives the browser.
export default defineConfig({
  testDir: './e2e',
  outputDir: '.verify/playwright',
  timeout: 45_000,
  retries: 0,
  workers: 4,
  reporter: [['list'], ['json', { outputFile: '.verify/e2e-results.json' }]],
  use: {
    baseURL: process.env.SITE_URL || 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
