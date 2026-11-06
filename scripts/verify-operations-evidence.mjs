import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'
process.loadEnvFile('.env.e2e.local')
const catalog=JSON.parse(fs.readFileSync('e2e/fixtures/business-readiness.json','utf8'))
const publicTerms=new Set(catalog.roles.flatMap(r=>[r.role.toLowerCase(),...r.role.toLowerCase().split('_'),...r.prefix.split(/[/-]/)]).filter(Boolean))
const secrets=Object.entries(process.env).filter(([key,value])=>/^E2E_.*_(USERNAME|PASSWORD)$/.test(key)&&value&&!(key.endsWith('_USERNAME')&&publicTerms.has(value))).map(([,value])=>value)
let pngs=0,texts=0
function scan(file){if(!fs.existsSync(file))return;if(fs.statSync(file).isDirectory()){for(const e of fs.readdirSync(file))scan(path.join(file,e));return}if(/\.(zip|har|webm)$/i.test(file))throw Error('Unexpected capture artifact');if(file.endsWith('.png')){if(fs.readFileSync(file).subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid PNG');pngs++;return}if(!/\.(json|txt|md|html)$/.test(file))return;const s=fs.readFileSync(file,'utf8');texts++;if(secrets.some(secret=>s.includes(secret))||/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(s))throw Error('Credential/token pattern found; values suppressed')}
for(const file of ['ui-test-results/OPS_20261106','ui-test-results/OPS_REGRESSION_20261106','ops-live-results','ops-isolated-results','e2e-private/ops-operations.json','docs/ui-ux-test-report.md','../docs/content-guidelines.md','../docs/ui-ux-guidelines.md'])scan(file)
const index=JSON.parse(fs.readFileSync('ui-test-results/OPS_20261106/evidence-index.json','utf8'))
for(const row of index.rows){for(const c of Object.values(row.phases)){const bytes=fs.readFileSync(c.file);if(bytes.readUInt32BE(16)!==row.viewport.width||bytes.readUInt32BE(20)!==row.viewport.height)throw Error('Viewport mismatch');if(crypto.createHash('sha256').update(bytes).digest('hex')!==c.sha256)throw Error('Image hash mismatch')}if(row.phases.before&&(!row.phases.after||row.phases.after.result!=='PASS'))throw Error('Missing successful after for baseline')}
const report=fs.readFileSync('docs/ui-ux-test-report.md','utf8')
for(const match of report.matchAll(/\]\(([^)]+)\)/g)){if(!/^(https?:|#)/.test(match[1])&&!fs.existsSync(path.resolve('docs',match[1])))throw Error('Broken report link')}
if(index.summary.pairs<100)throw Error('Expected completed before/after coverage')
console.log(`OPS evidence PASS: ${index.summary.pairs} matching pairs; ${pngs} PNGs across current and regression runs; ${texts} text artifacts checked. Image headers/hashes/links and configured-credential/JWT checks pass. Masking is selector-based with visual spot checks, not OCR certification.`)
