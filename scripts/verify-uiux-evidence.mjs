import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
process.loadEnvFile('.env.e2e.local')
const catalog = JSON.parse(fs.readFileSync('e2e/fixtures/business-readiness.json', 'utf8'))
const publicTerms = new Set(catalog.roles.flatMap(row => [row.role.toLowerCase(), ...row.role.toLowerCase().split('_'), ...row.prefix.split(/[/-]/)]).filter(Boolean))
const secrets = Object.entries(process.env).filter(([key,value]) => /^E2E_.*_(USERNAME|PASSWORD)$/.test(key) && value && !(key.endsWith('_USERNAME') && publicTerms.has(value))).map(([,value]) => value)
let texts = 0, pngs = 0
function verify(file) {
  if (!fs.existsSync(file)) return
  if (fs.statSync(file).isDirectory()) { for (const entry of fs.readdirSync(file)) verify(path.join(file,entry)); return }
  if (/\.(har|zip|webm|pdf)$/i.test(file)) throw new Error('Unexpected capture/export artifact; no values printed')
  if (file.endsWith('.png')) { if (fs.readFileSync(file).subarray(0,8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Invalid PNG'); pngs++; return }
  if (!/\.(json|md|txt|html)$/.test(file)) return
  const value = fs.readFileSync(file, 'utf8'); texts++
  if (secrets.some(secret => value.includes(secret)) || /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(value)) throw new Error('Credential/token pattern detected; values omitted')
}
for (const file of ['ui-test-results/UIUX_20261106','final-flow-test-results','e2e-private/uiux-20261106.json','e2e-private/uiux-api-assertions.json','e2e-private/uiux-operations.json','e2e-private/uiux-zoom.json','docs/ui-ux-test-report.md','../docs/ui-ux-guidelines.md']) verify(file)
const index = JSON.parse(fs.readFileSync('ui-test-results/UIUX_20261106/evidence-index.json','utf8'))
let pairs = 0
for (const row of index.rows) {
  for (const capture of Object.values(row.phases)) if (!fs.existsSync(capture.file)) throw new Error('Evidence link target missing')
  if (row.phases.before && row.phases.after) { if (row.phases.before.result !== 'REPRODUCED' || row.phases.after.result !== 'PASS') throw new Error('Invalid before/after result'); pairs++ }
}
if (pairs < 5) throw new Error('Expected matching original before/after evidence')
console.log(`UIUX evidence PASS: ${pngs} actual PNGs, ${texts} text artifacts, ${pairs} matching before/after pairs; file links exist, metadata/configured-credential/JWT checks passed. PII masking is performed by captureEvidence; this is not an OCR audit.`)
