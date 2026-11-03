import fs from 'node:fs'
import { unzipSync, strFromU8 } from 'fflate'
process.loadEnvFile('.env.e2e.local')
const catalog=JSON.parse(fs.readFileSync('e2e/fixtures/business-readiness.json','utf8'))
// Public role aliases/routes are source literals, not credential-derived data. Always scan passwords and all non-public usernames.
const publicRoleTerms=new Set(catalog.roles.flatMap(role=>[role.role.toLowerCase(),...role.role.toLowerCase().split('_'),...role.prefix.split(/[/-]/)]).filter(Boolean))
const secrets=Object.entries(process.env).filter(([key,value])=>/^E2E_.*_(USERNAME|PASSWORD)$/.test(key)&&value&&!(key.endsWith('_USERNAME')&&publicRoleTerms.has(value))).map(([,value])=>value)
let checked=0
function inspect(text) {
  checked++
  if(secrets.some(value=>text.includes(value))||/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text)) throw new Error('Privacy check failed; sensitive content detected, values omitted.')
}
function walk(path) {
  if(!fs.existsSync(path))return
  if(fs.statSync(path).isDirectory())for(const entry of fs.readdirSync(path))walk(path+'/'+entry)
  else if(/\.(md|json|txt|html)$/.test(path))inspect(fs.readFileSync(path,'utf8'))
  else if(path.endsWith('.zip'))for(const bytes of Object.values(unzipSync(fs.readFileSync(path))))inspect(strFromU8(bytes))
}
for(const path of ['business-test-results','e2e-private/business-results.json','docs/business-workflow-readiness.md','docs/business-workflow-matrix.md','docs/business-readiness-source-review.md'])walk(path)
console.log(`Readiness privacy check passed: ${checked} entries; no passwords, non-public usernames or JWT patterns found; public role aliases are checked against source.`)

