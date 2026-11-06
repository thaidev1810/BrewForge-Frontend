import fs from 'node:fs'
import { unzipSync, strFromU8 } from 'fflate'
process.loadEnvFile('.env.e2e.local')
const secrets = Object.entries(process.env).filter(([name, value]) => /^E2E_.*_(USERNAME|PASSWORD)$/.test(name) && value).map(([, value]) => value)
let checked = 0, leaks = 0
function inspect(text) {
  checked++
  if (secrets.some(value => text.includes(value)) || /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(text)) leaks++
}
function walk(directory) {
  if (!fs.existsSync(directory)) return
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const path = directory + '/' + entry.name
    if (entry.isDirectory()) walk(path)
    else if (entry.name.endsWith('.zip')) {
      for (const [name, bytes] of Object.entries(unzipSync(fs.readFileSync(path)))) {
        if (!name.endsWith('.trace')) throw new Error('Unexpected trace resource; inspect locally without logging payloads.')
        inspect(strFromU8(bytes))
      }
    } else if (/\.(md|json|txt|html)$/.test(entry.name)) inspect(fs.readFileSync(path, 'utf8'))
  }
}
walk('test-results')
inspect(fs.readFileSync('docs/e2e-auth-report.md', 'utf8'))
if (leaks) throw new Error('Sensitive material detected in artifacts; no values printed.')
console.log(`Privacy check passed for ${checked} text/trace entries; no configured credentials or JWT patterns found.`)
