import { defineConfig } from '@playwright/test'
import base from './playwright.config.js'

export default defineConfig({ ...base, testDir: './e2e/experience', outputDir: 'experience-test-results', workers: 1, retries: 0 })
