import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
const file = fileURLToPath(new URL('../../.env.e2e.local', import.meta.url))
if (existsSync(file)) process.loadEnvFile(file)
export const roles = ['ADMIN', 'RD_SPECIALIST', 'RD_MANAGER', 'TRAINER', 'TRAINING_MANAGER', 'TRAINEE', 'BRANCH_MANAGER', 'QUALITY_AUDITOR'] as const
export type TestRole = typeof roles[number]
export function getTestCredentials(role: TestRole) {
  const names = [`E2E_${role}_USERNAME`, `E2E_${role}_PASSWORD`]
  const missing = names.filter(name => !process.env[name]?.trim())
  if (missing.length) throw new Error('Missing environment: ' + missing.join(', '))
  return { username: process.env[names[0]]!, password: process.env[names[1]]! }
}
