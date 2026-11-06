import { defineConfig, devices } from '@playwright/test'
import process from 'node:process'
import './e2e/helpers/environment.js'
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1'
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173'
const target = new URL(baseURL)
if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) throw new Error('E2E_BASE_URL must use a local frontend.')
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, retries: 0,
  reporter: [['list']],
  use: { baseURL, ...devices['Desktop Chrome'], headless: false, trace: 'off', screenshot: 'off', video: 'off' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: `npm run dev -- --host ${target.hostname} --port ${target.port || '5173'} --strictPort`,
    url: baseURL, reuseExistingServer: true, timeout: 120_000,
    env: { ...(process.env.E2E_API_BASE_URL ? { VITE_API_BASE_URL: process.env.E2E_API_BASE_URL } : {}) },
  },
})




