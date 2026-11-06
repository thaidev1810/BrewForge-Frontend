// Only the documented anonymous OpenAPI GET, no business endpoints or writes.
import fs from 'node:fs'
import assert from 'node:assert/strict'
const source = fs.readFileSync('src/services/backend/schema.ts', 'utf8')
const endpoints = JSON.parse(source.split('export const endpoints = ')[1].replace(/ as const\s*$/, ''))
const response = await fetch('http://localhost:5113/openapi/v1.json', { signal: AbortSignal.timeout(10000) })
assert.equal(response.status, 200)
const spec = await response.json()
const normalize = p => p.replace(/\{\*\*([^}]+)\}/g, '{$1}').replace(/:long/g, '')
const actual = Object.entries(spec.paths).flatMap(([p, methods]) => Object.keys(methods).filter(m => ['get','post','put','delete','patch'].includes(m)).map(m => m.toUpperCase() + ' ' + p)).sort()
const expected = Object.values(endpoints).map(e => e.method + ' ' + normalize(e.path)).sort()
assert.deepEqual(actual, expected, 'Live OpenAPI route inventory matches current code metadata')
const details = { status: response.status, operations: actual.length, paths: Object.keys(spec.paths).length, bearer: spec.components?.securitySchemes?.Bearer, documentSecurity: spec.security, loginOperationSecurity: spec.paths['/api/v1/auth/login']?.post?.security, multipartEvidence: spec.paths['/api/v1/branch-audits/evidence']?.post?.requestBody ?? null, scheduleBody: spec.components?.schemas?.PracticalScheduleRequest }
console.log(JSON.stringify(details, null, 2))
console.log('PASS live anonymous OpenAPI route inventory; this does not verify business flows, roles or database mappings.')
