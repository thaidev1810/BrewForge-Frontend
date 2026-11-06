import fs from 'node:fs'
import path from 'node:path'
const metadata = fs.readFileSync('src/services/backend/schema.ts', 'utf8')
const operations = [...metadata.matchAll(/^  ['"]([^'"]+)['"]: \{/gm)].map(m => m[1])
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : [])
}
const source = files('src').filter(f => !f.replaceAll('\\', '/').startsWith('src/services/backend/')).map(f => fs.readFileSync(f, 'utf8')).join('\n')
const referenced = operations.filter(op => source.includes(`'${op}'`) || source.includes(`"${op}"`) || op.startsWith('Auth.') && source.includes("'/auth/" + ({ Login: 'login', Me: 'me', Refresh: 'refresh', Logout: 'logout' }[op.split('.')[1]]) + "'"))
console.log(JSON.stringify({ registered: operations.length, referencedByScreensOrSession: referenced.length, unreferenced: operations.filter(op => !referenced.includes(op)), note: 'Static UI/session references, not evidence of successful live HTTP requests.' }, null, 2))
