import base from './playwright.config.js'
import { defineConfig } from '@playwright/test'
export default defineConfig({ ...base, testMatch: '**/business/readiness.spec.ts', outputDir: 'business-test-results', workers: 1, fullyParallel: false, retries: 0 })
