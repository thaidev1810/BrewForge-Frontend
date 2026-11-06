import fs from 'node:fs'
import path from 'node:path'

// Reproducible static contract extraction. No backend process, DB, env secrets or network.
const backend = path.resolve('../backend/src')
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? ['bin', 'obj'].includes(e.name) ? [] : files(path.join(dir, e.name)) : [path.join(dir, e.name)]) }
const sources = files(backend).filter(f => f.endsWith('.cs')).map(f => ({ file: path.relative(path.resolve('..'), f).replaceAll('\\', '/'), text: fs.readFileSync(f, 'utf8') }))
function balanced(s, start) { let depth = 0, quoted = false, escape = false; for (let i = start; i < s.length; i++) { const c = s[i]; if (quoted) { if (escape) escape = false; else if (c === '\\') escape = true; else if (c === '"') quoted = false; continue } if (c === '"') { quoted = true; continue } if (c === '(') depth++; if (c === ')' && --depth === 0) return i } throw new Error('Unbalanced C# declaration') }
function split(s) { let depth = 0, at = 0; const result = []; for (let i = 0; i < s.length; i++) { if ('<([{'.includes(s[i])) depth++; if ('>)]}'.includes(s[i])) depth--; if (s[i] === ',' && depth === 0) { result.push(s.slice(at, i).trim()); at = i + 1 } } return [...result, s.slice(at).trim()].filter(Boolean) }
const snake = s => s.split('').map((c, i) => (i && /[A-Z]/.test(c) ? '_' : '') + c.toUpperCase()).join('')
const camel = s => s[0].toLowerCase() + s.slice(1)
const records = {}, enums = {}, endpoints = {}
for (const { file, text } of sources) {
  for (const m of text.matchAll(/public\s+(?:sealed\s+|readonly\s+)?record\s+(?:struct\s+)?(\w+)(?:<[^>]+>)?\s*\(/g)) {
    const end = balanced(text, m.index + m[0].length - 1)
    records[m[1]] = { source: file, fields: split(text.slice(m.index + m[0].length, end)).map(p => { const f = p.replace(/\s*=.*$/s, '').match(/^(.+?)\s+(\w+)$/s); return { type: f[1].replace(/\s+/g, ' '), name: camel(f[2]) } }) }
  }
  for (const m of text.matchAll(/public enum (\w+)\s*\{/g)) {
    const body = text.slice(m.index + m[0].length, text.indexOf('}', m.index)).replace(/\/\/[^\n]*/g, '')
    enums[m[1]] = split(body).map(v => { const override = v.match(/\[Code\("([^"]+)"\)\]/); return override ? override[1] : snake(v.trim().match(/^(\w+)/)[1]) })
  }
}
for (const { file, text } of sources.filter(s => s.file.includes('/Controllers/'))) {
  const classes = [...text.matchAll(/public sealed class (\w+)\s*\(/g)]
  for (let ci = 0; ci < classes.length; ci++) {
    const c = classes[ci], end = classes[ci + 1]?.index ?? text.length, segment = text.slice(c.index, end), before = text.slice(ci ? classes[ci - 1].index : 0, c.index), attrs = before.slice(before.lastIndexOf('[ApiController]'))
    const prefix = attrs.match(/Route\("([^"]+)"\)/)[1]
    const methods = [...segment.matchAll(/public\s+(?:async\s+)?([\w<>,?\s]+?)\s+(\w+)\s*\(/g)]
    for (let mi = 0; mi < methods.length; mi++) {
      const m = methods[mi], prior = segment.slice(mi ? methods[mi - 1].index : 0, m.index), hi = prior.lastIndexOf('[Http')
      if (hi < 0) continue
      const local = prior.slice(hi), http = local.match(/Http(Get|Post|Put|Delete|Patch)(?:\("([^"]*)"\))?/), all = attrs + local
      const groups = [...all.matchAll(/AuthorizeRoles\(([^)]+)\)|Authorize\(Policy\s*=\s*Policies\.(\w+)\)/g)].map(a => a[1] ? [...a[1].matchAll(/RoleName\.(\w+)/g)].map(x => snake(x[1])) : a[2] === 'HeadOffice' ? enums.RoleName.filter(r => !['TRAINEE', 'BRANCH_MANAGER'].includes(r)) : [snake(a[2])])
      const roles = all.includes('AllowAnonymous') ? [] : groups.length ? groups.reduce((a, b) => a.filter(r => b.includes(r))) : enums.RoleName
      const start = m.index + m[0].length - 1, finish = balanced(segment, start), parameters = split(segment.slice(start + 1, finish)).filter(p => !p.includes('CancellationToken') && !p.includes('[FromServices]')).map(p => { const binding = p.match(/\[(From\w+)/)?.[1]; const f = p.replace(/\[[^\]]*\]\s*/g, '').trim().match(/^(.+?)\s+(\w+)$/s); return { type: f[1].trim(), name: f[2], binding } })
      const body = parameters.find(p => /Request\??$/.test(p.type)), queries = parameters.filter(p => p.binding === 'FromQuery'), paths = parameters.filter(p => !p.binding && !/Request\??$/.test(p.type))
      let response = m[1].replace(/\s+/g, ''); while (/^(Task|ActionResult)<.*>$/.test(response)) response = response.replace(/^(?:Task|ActionResult)<(.*)>$/, '$1')
      const raw = segment.slice(finish, methods[mi + 1]?.index ?? segment.length)
      const id = c[1].replace(/Controller$/, '') + '.' + m[2]
      endpoints[id] = { method: http[1].toUpperCase(), path: '/' + [prefix, http[2]].filter(Boolean).join('/'), roles, source: file, body: body?.type.replace('?', '') ?? null, optionalBody: body?.type.endsWith('?') ?? false, query: queries.flatMap(p => p.type === 'PageQuery' ? [{ name: 'page', type: 'int?' }, { name: 'size', type: 'int?' }, { name: 'sort', type: 'string?' }] : [{ name: p.name, type: p.type }]), params: paths, response, binary: ['IActionResult', 'FileContentResult'].includes(response), upload: /UploadEvidence|UploadPracticalVideo|\.Import$/.test(id), idempotency: parameters.some(p => p.binding === 'FromHeader'), status: raw.includes('NoContent()') ? 204 : /CreatedAtAction\(|\bCreated\(|StatusCodes.Status201Created/.test(raw) ? 201 : 200 }
    }
  }
}
if (Object.keys(endpoints).length !== 191) throw new Error('Controller endpoint coverage changed: ' + Object.keys(endpoints).length + '; review before generating')
const used = new Set(['RoleName', 'ErrorEnvelope', 'ErrorDetail'])
function collect(t) { if (!t) return; const tokens = t.match(/\b\w+\b/g) ?? []; for (const n of tokens) if ((records[n] || enums[n]) && !used.has(n)) { used.add(n); records[n]?.fields.forEach(f => collect(f.type)) } }
Object.values(endpoints).forEach(e => { collect(e.body); collect(e.response) })
// Polymorphic objects are rendered by CourseRenderer, not recoverable from positional record alone.
for (const n of ['OverviewReference', 'IngredientsReference', 'EquipmentListReference', 'StepReference', 'TechniqueGateReference']) collect(n)
function ts(t) { t = t.trim(); if (t.endsWith('?')) return ts(t.slice(0, -1)) + ' | null'; const generic = t.match(/^(\w+)<([\s\S]+)>$/); if (generic) { const [kind, inner] = [generic[1], generic[2]]; if (['IReadOnlyList', 'IReadOnlyCollection', 'IEnumerable'].includes(kind)) return `Array<${ts(inner)}>`; if (kind === 'PagedResult') return `PagedResult<${ts(inner)}>`; if (kind === 'IReadOnlyDictionary') return `Record<string, ${ts(split(inner)[1])}>` } if (['long', 'int', 'decimal', 'double'].includes(t)) return 'number'; if (t === 'bool') return 'boolean'; if (['DateOnly', 'TimeOnly', 'DateTimeOffset', 'string'].includes(t)) return 'string'; if (['IActionResult', 'FileContentResult'].includes(t)) return 'Blob'; if (['Task', 'void'].includes(t)) return 'void'; return records[t] || enums[t] ? t : 'unknown' }
let out = '// Generated from checked-in BrewForge C# controller/DTO source. Run npm run contracts:generate.\n// Dates/times are wire strings; IDs are JSON numbers, never strings in requests.\n\nexport interface PagedResult<T> { items: T[]; page: number; size: number; total: number }\n'
for (const name of [...used].sort()) { if (name === 'PagedResult') continue; if (enums[name]) out += `\nexport const ${name}Values = ${JSON.stringify(enums[name])} as const\nexport type ${name} = typeof ${name}Values[number]\n`; else if (records[name]) { const r = records[name]; out += `\n/** ${r.source} */\nexport interface ${name} {\n${r.fields.map(f => `  ${f.name}: ${ts(f.type)}`).join('\n')}\n}\n` } }
out += '\nexport type LessonReference = OverviewReference | IngredientsReference | EquipmentListReference | StepReference | TechniqueGateReference | null\n\nexport interface EndpointContracts {\n'
for (const [id, e] of Object.entries(endpoints)) out += `  '${id}': { request: ${e.body ? ts(e.body) : e.upload ? 'FormData' : 'never'}; response: ${ts(e.response)}; params: ${e.params.length ? '{' + e.params.map(p => `${p.name}: ${ts(p.type)};`).join('') + '}' : 'Record<string, never>'}; query: ${e.query.length ? '{' + e.query.map(q => `${q.name}?: ${ts(q.type)};`).join('') + '}' : 'Record<string, never>'} }\n`
out += '}\nexport type Operation = keyof EndpointContracts\n'
fs.mkdirSync('src/services/backend', { recursive: true })
fs.writeFileSync('src/services/backend/contracts.ts', out)
fs.writeFileSync('src/services/backend/schema.ts', `// Generated request schemas and route metadata; business validations are in validation.ts.\nexport const schemas = ${JSON.stringify(Object.fromEntries(Object.entries(records).filter(([n]) => used.has(n)).map(([n,r]) => [n,r.fields])), null, 2)} as const\nexport const enumValues = ${JSON.stringify(Object.fromEntries(Object.entries(enums).filter(([n]) => used.has(n))), null, 2)} as const\nexport const endpoints = ${JSON.stringify(endpoints, null, 2)} as const\n`)
console.log(`Generated ${Object.keys(endpoints).length} operations, ${used.size} wire types/enums from backend source (no runtime API calls).`)
