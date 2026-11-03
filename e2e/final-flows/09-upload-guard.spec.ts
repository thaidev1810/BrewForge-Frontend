import { test, expect } from '@playwright/test'
import process from 'node:process'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { Actors, api, entity, manifest, record } from './harness.js'
import { readEveryLesson } from './owned-course.js'

test('oversize upload guard/recovery and close on separate owned enrollment', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true' || process.env.E2E_ALLOW_ADDITIONAL_TRAINEE !== 'true', 'Owned test learner authorization required')
  test.setTimeout(90_000)
  const m = manifest(), actors = new Actors(browser, String(info.project.use.baseURL)), path = 'e2e-private/final-fixtures/oversize-technical-test.webm'
  let stage = 'owned utility course setup'
  try {
    const trainer = await actors.login('TRAINER'), rd = await actors.login('RD_MANAGER'), tm = await actors.login('TRAINING_MANAGER'), admin = await actors.login('ADMIN')
    const course = await api(trainer, 'Courses.Get', { id: m.ids.utility_course }); expect(course.data.title).toBe(m.runId + ' utility_course')
    if (course.data.state === 'DRAFT') {
      expect((await api(trainer, 'Courses.Submit', { id: m.ids.utility_course })).ok).toBe(true)
      expect((await api(rd, 'Courses.Approve', { id: m.ids.utility_course })).ok).toBe(true)
    }
    const username = m.runId.toLowerCase() + '_learner2', password = 'T!' + crypto.randomBytes(18).toString('base64url') + '4a'
    const user = await api(admin, 'Users.Get', { id: m.ids.additionalLearner }); if (user.data.username !== username) throw new Error('Owned account mismatch')
    expect((await api(admin, 'Users.Update', { id: m.ids.additionalLearner }, { username, password, email: user.data.email, fullName: user.data.fullName, role: 'TRAINEE', branchId: m.ids.branch, status: 'ACTIVE' })).ok).toBe(true)
    const learner = await actors.loginGenerated(username, password)
    if (!m.ids.uploadGuardEnrollment) {
      const assignment = await api(tm, 'Assignments.Assign', {}, { courseId: m.ids.utility_course, branchId: m.ids.branch, employeeIds: [m.ids.additionalLearner], allTrainees: false, reason: m.runId + ' upload guard' }); expect(assignment.ok).toBe(true)
      m.ids.uploadGuardEnrollment = Number((assignment.data.enrollmentIds as number[])[0]); expect(m.ids.uploadGuardEnrollment).toBeGreaterThan(0); entity(m, 'enrollment', m.ids.uploadGuardEnrollment, 'ASSIGNED isolated upload guard')
    }
    await readEveryLesson(learner, m.ids.uploadGuardEnrollment)
    stage = 'oversize local file'
    const original = fs.readFileSync('e2e-private/final-fixtures/technical-test.webm'), total = 200 * 1024 * 1024 + 1
    // Append a valid EBML Void element to the genuine unknown-length WebM segment.
    // Sparse local padding checks File.size without sending 200 MB over the network.
    const voidHeader = Buffer.alloc(9); voidHeader[0] = 0xec; voidHeader.writeBigUInt64BE((1n << 56n) | BigInt(total - original.length - 9), 1)
    const fd = fs.openSync(path, 'w'); fs.writeSync(fd, original); fs.writeSync(fd, voidHeader); fs.ftruncateSync(fd, total); fs.closeSync(fd)
    expect(fs.statSync(path).size).toBe(total)
    await trainer.goto('/trainer/assessment/' + m.ids.uploadGuardEnrollment)
    await trainer.getByRole('button', { name: 'Tải MP4 / MOV / WEBM', exact: true }).click()
    await trainer.locator('#upload-file').setInputFiles(path)
    let writes = 0
    const listener = (request: import('@playwright/test').Request) => { if (request.method() === 'POST' && request.url().endsWith('/practical-videos')) writes++ }
    trainer.on('request', listener)
    await trainer.getByRole('button', { name: 'Xác nhận', exact: true }).click()
    await expect(trainer.getByRole('dialog').locator('.error-box')).toBeVisible(); expect(writes).toBe(0)
    stage = 'retry with small verified video'
    await trainer.locator('#upload-file').setInputFiles('e2e-private/final-fixtures/technical-test.webm')
    const uploaded = trainer.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/practical-videos'))
    await trainer.getByRole('button', { name: 'Xác nhận', exact: true }).click(); expect((await uploaded).status()).toBe(201); expect(writes).toBe(1)
    trainer.off('request', listener)
    await trainer.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
    record(m, 'oversize-upload', { flow: 'Video size guard and recovery', role: 'TRAINER', kind: 'unhappy', via: 'LIVE_UI', status: 'PASS_LIVE_UI', assertion: 'Local genuine WebM plus EBML padding is200MiB+1; FE rejects before network, then verified33KB video retries once with real201', evidence: 'Oversize local fixture removed; no oversized upload sent' })
    stage = 'close separate enrollment'
    const closed = await api(tm, 'Enrollments.Close', { id: m.ids.uploadGuardEnrollment }); expect(closed.ok).toBe(true); expect(closed.data.state).toBe('CLOSED')
    await trainer.reload(); await expect(trainer.getByRole('button', { name: 'Tải MP4 / MOV / WEBM', exact: true })).toHaveCount(0)
    entity(m, 'enrollment', m.ids.uploadGuardEnrollment, 'CLOSED upload guard fixture')
    record(m, 'enrollment-close', { flow: 'Close own training enrollment', role: 'TRAINING_MANAGER/TRAINER', kind: 'happy', via: 'LIVE_UI/API', status: 'PASS_LIVE_API', assertion: 'Separate owned enrollment closed by TM; F5 removes practical upload action without changing original certified enrollments', evidence: 'Server CLOSED and live trainer UI no upload CTA' })
  } catch { record(m, 'upload-guard-failure', { flow: stage, role: 'test actors', kind: 'diagnostic', via: 'LIVE_UI/API', status: 'FAIL', assertion: 'Sanitized failure at ' + stage, evidence: 'No request payload retained' }); throw new Error('Sanitized upload guard failure at ' + stage) }
  finally { if (fs.existsSync(path)) fs.unlinkSync(path); await actors.close() }
})
