import { defineConfig } from '@playwright/test'
import base from './playwright.config.js'
export default defineConfig({ ...base, testDir: './e2e/final-flows', outputDir: 'final-flow-test-results', use: { ...base.use, actionTimeout: 15_000, navigationTimeout: 20_000 }, workers: 1, retries: 0 })
