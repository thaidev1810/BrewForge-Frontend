import fs from 'node:fs'
process.loadEnvFile('.env.e2e.local')
const matrix = JSON.parse(fs.readFileSync('e2e/fixtures/permission-matrix.json', 'utf8'))
const publicTerms = new Set(matrix.flatMap(row => [row.role.toLowerCase(), ...row.role.toLowerCase().split('_'), ...row.prefix.split(/[/-]/)]).filter(Boolean))
const secrets = Object.entries(process.env).filter(([name, value]) => /^E2E_.*_(USERNAME|PASSWORD)$/.test(name) && value && !(name.endsWith('_USERNAME') && publicTerms.has(value))).map(([, value]) => value)
let checked = 0
function walk(path) {
  if (!fs.existsSync(path)) return
  if (fs.statSync(path).isDirectory()) { for (const entry of fs.readdirSync(path)) walk(path + '/' + entry); return }
  if (path.endsWith('.zip') || /\.(webm|har)$/.test(path)) throw new Error('Unexpected live capture artifact; values omitted.')
  if (!/\.(md|json|txt|html)$/.test(path)) return
  const text = fs.readFileSync(path, 'utf8'); checked++
  if (secrets.some(value => text.includes(value)) || /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text)) throw new Error('Sensitive content detected; no values printed.')
}
for (const path of ['experience-test-results', 'e2e-private/experience-live.json', 'e2e-private/experience-business.json', 'e2e-private/experience-business-history.json', 'e2e-private/experience-continuation.json', 'e2e-private/experience-continuation-history.json', 'e2e-private/experience-quality.json', 'e2e-private/experience-quality-first.json', 'e2e-private/experience-validation.json', 'e2e-private/experience-read-controls.json', 'docs/experience-test-report.md']) walk(path)
console.log(`Experience privacy check PASS: ${checked} text entries; no passwords, non-public usernames, JWTs or live capture files.`)
