// Runs the actual skill Python tool; never substitutes a JS search or installs Python.
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const script = path.resolve('.agents/skills/ui-ux-pro-max/scripts/search.py')
if (!fs.existsSync(script)) throw new Error('Project-local skill search.py is missing')
const candidates = process.env.UIUX_PYTHON ? [[process.env.UIUX_PYTHON, []]] : [['py', ['-3']], ['C:/Windows/py.exe', ['-3']]]
if (!process.env.UIUX_PYTHON) for (const root of [path.join(process.env.LOCALAPPDATA ?? '', 'Programs/Python'), path.join(process.env.LOCALAPPDATA ?? '', 'Python')]) {
  if (!fs.existsSync(root)) continue
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) if (entry.isDirectory()) { const executable = path.join(root, entry.name, 'python.exe'); if (fs.existsSync(executable)) candidates.push([executable, []]) }
}
let interpreter
for (const [executable, prefix] of candidates) {
  const probe = spawnSync(executable, [...prefix, '--version'], { encoding: 'utf8', timeout: 5000, windowsHide: true })
  if (probe.status === 0 && /Python 3\./.test(probe.stdout + probe.stderr)) { interpreter = { executable, prefix, version: (probe.stdout + probe.stderr).trim() }; break }
}
const queries = [
  { query: 'keyboard focus modal', args: ['--domain', 'ux'] },
  { query: 'error summary validation', args: ['--domain', 'ux'] },
  { query: 'data table keyboard scroll', args: ['--domain', 'ux'] },
  { query: 'dialog focus ref cleanup', args: ['--stack', 'react'] },
  { query: 'table handling', args: ['--domain', 'ux'], retryOf: 'data table keyboard scroll' },
  { query: 'keyboard navigation', args: ['--domain', 'ux'] },
]
const result = { skill: 'ui-ux-pro-max', cliVersion: '2.15.0', script, interpreter: interpreter ? { version: interpreter.version } : null, status: interpreter ? 'EXECUTED_NEEDS_REVIEW' : 'BLOCKED_PYTHON', queries: [] }
for (const query of queries) {
  if (!interpreter) { result.queries.push({ ...query, status: 'NOT_RUN', reason: 'py -3 unavailable; no working Python path found. SKILL Quick Reference fallback was used explicitly; no BM25 results claimed.' }); continue }
  const execution = spawnSync(interpreter.executable, [...interpreter.prefix, script, query.query, ...query.args, '--json', '-n', '3'], { encoding: 'utf8', timeout: 15000, windowsHide: true, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } })
  if (execution.status !== 0) throw new Error('Skill search failed; no implementation recommendation recorded')
  const output = JSON.parse(execution.stdout)
  result.queries.push({ ...query, status: 'EXECUTED', output, verifiedForImplementation: false })
}
fs.mkdirSync('ui-test-results/UIUX_20261106', { recursive: true })
fs.writeFileSync('ui-test-results/UIUX_20261106/skill-search.json', JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
if (!interpreter) process.exitCode = 2
