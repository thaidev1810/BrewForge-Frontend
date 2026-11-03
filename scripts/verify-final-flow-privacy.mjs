import fs from 'node:fs'
process.loadEnvFile('.env.e2e.local')
const catalog = JSON.parse(fs.readFileSync('e2e/fixtures/business-readiness.json', 'utf8'))
const publicTerms = new Set(catalog.roles.flatMap(row => [row.role.toLowerCase(), ...row.role.toLowerCase().split('_'), ...row.prefix.split(/[/-]/)]).filter(Boolean))
const secrets = Object.entries(process.env).filter(([key, value]) => /^E2E_.*_(USERNAME|PASSWORD)$/.test(key) && value && !(key.endsWith('_USERNAME') && publicTerms.has(value))).map(([, value]) => value)
let checked = 0
function walk(path) {
  if (!fs.existsSync(path)) return
  if (fs.statSync(path).isDirectory()) { for (const name of fs.readdirSync(path)) walk(path + '/' + name); return }
  if (/\.(zip|har|webm)$/.test(path) && !path.startsWith('e2e-private/final-fixtures/')) throw new Error('Unexpected capture artifact; values omitted')
  if (!/\.(md|json|txt|html|csv)$/.test(path)) return
  checked++
  const text = fs.readFileSync(path, 'utf8')
  if (secrets.some(value => text.includes(value)) || /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text) || /T![A-Za-z0-9_-]{24}[0-9]a/.test(text)) throw new Error('Credential/token pattern detected; no values printed')
}
for (const file of ['final-flow-test-results','e2e-private/final-flows-manifest.json','e2e-private/final-flow-operations.json','e2e-private/final-flow-inventory.json','e2e-private/final-fixtures','docs/final-flow-report.md','docs/final-flow-coverage.md']) walk(file)
console.log(`Final-flow privacy PASS: ${checked} text artifacts; no configured passwords, non-public usernames, JWTs or generated-password patterns. Capture artifacts disabled; WebM is the synthetic input fixture.`)
