import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import process from 'node:process'
import ts from 'typescript'
import { Actors, api, entity, identity, manifest, ownCheckpoint, record, save } from './harness.js'

test('continue owned enrollment: practical UI, real video, evaluation, certificate and retraining closure', async ({ browser }, info) => {
  test.skip(process.env.E2E_ALLOW_BUSINESS_WRITES !== 'true', 'Explicit local test/demo write opt-in required')
  test.setTimeout(180_000)
  const m = manifest(), actors = new Actors(browser, String(info.project.use.baseURL))
  let stage = 'checkpoint'
  const note = (id: string, flow: string, assertion: string, via = 'LIVE_API', kind = 'happy') => record(m, id, { flow, role: 'TRAINER/TRAINEE', kind, via, status: via === 'LIVE_UI' ? 'PASS_LIVE_UI' : 'PASS_LIVE_API', assertion, evidence: `manifest ${m.runId}` })
  try {
    const trainer = await actors.login('TRAINER')
    const { course } = await ownCheckpoint(trainer, m)
    const enrollment = await api(trainer, 'Enrollments.Get', { id: m.ids.enrollment })
    expect(enrollment.ok).toBe(true); expect(enrollment.data.courseId).toBe(m.ids.course)
    const attempts = await api(trainer, 'Enrollments.QuizAttempts', { id: m.ids.enrollment })
    expect((attempts.data as unknown as { passed: boolean }[]).some(row => row.passed)).toBe(true)
    entity(m, 'enrollment', m.ids.enrollment, String(enrollment.data.state), 'practical recording/evaluation')
    note('checkpoint', 'Checkpoint ownership/current cycle', 'Recipe code, version/course/enrollment relationships and real quiz history verified')
    // File configuration is inspected without printing channel keys/credentials. Runtime push is also queried.
    let email: Record<string, unknown> = {}
    for (const name of ['appsettings.json', 'appsettings.Development.json', 'appsettings.Local.json']) {
      const file = '../backend/src/BrewForge.Api/' + name
      if (fs.existsSync(file)) email = { ...email, ...(ts.parseConfigFileTextToJson(file, fs.readFileSync(file, 'utf8')).config?.Email ?? {}) }
    }
    const push = await api(trainer, 'Notifications.PushConfig')
    expect(push.ok).toBe(true); expect(push.data.enabled).toBe(false)
    expect(Boolean(email.From && (email.Host || email.PickupDirectory))).toBe(false)
    m.safety = { localApiVerified: true, configuredEmailDisabled: true, runtimePushDisabled: true, syntheticFixture: true }; save(m)
    const currentVideos = await api(trainer, 'Enrollments.PracticalVideos', { id: m.ids.enrollment })
    const videos = currentVideos.data as unknown as { id: number; evaluationId: number | null; uploadedBy: number }[]
    const who = await identity(trainer)
    if (enrollment.data.state !== 'PASSED') {
      stage = 'no-video evaluation refusal'
      const checklist = course.practicalChecklist as { recipeStepId: number }[]
      const noVideo = await api(trainer, 'Enrollments.EvaluatePractical', { id: m.ids.enrollment }, { practicalVideoId: null, items: checklist.map(item => ({ recipeStepId: item.recipeStepId, passed: true, note: 'Automated technical test only' })) })
      expect(noVideo.status).toBe(409); expect(noVideo.rule).toBe('PRACTICAL_VIDEO')
      note('practical-no-video', 'Practical missing recording', 'Real evaluation HTTP 409 PRACTICAL_VIDEO before a recording is supplied', 'LIVE_API', 'unhappy')
      stage = 'schedule UI'
      await trainer.goto('/trainer/assessment/' + m.ids.enrollment)
      await expect(trainer.getByRole('button', { name: 'Tải MP4 / MOV / WEBM', exact: true })).toBeVisible()
      const schedules = await api(trainer, 'PracticalSchedules.ForEnrollment', { id: m.ids.enrollment })
      const open = (schedules.data as unknown as { id: number; status: string }[]).find(row => row.status === 'SCHEDULED')
      if (!open) {
        await trainer.getByRole('button', { name: 'Đặt lịch', exact: true }).click()
        const localDate = new Date(Date.now() + 3600_000 + 7 * 3600_000).toISOString().slice(0, 16)
        await trainer.locator('#scheduledAt').fill(localDate)
        await trainer.locator('#location').fill(m.runId + ' technical test')
        const scheduled = trainer.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/enrollments/' + m.ids.enrollment + '/practical-schedules')
        await trainer.getByRole('button', { name: 'Xác nhận', exact: true }).click()
        const response = await scheduled; expect(response.status()).toBe(201)
        const data = await response.json(); m.ids.schedule = data.id; entity(m, 'practical schedule', data.id, data.status)
        await trainer.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
      } else m.ids.schedule = open.id
      note('practical-schedule', 'Practical schedule', 'Current quiz-passed enrollment scheduled via real UI/API; future time and owner retained', 'LIVE_UI')
      stage = 'invalid upload UI'
      await trainer.getByRole('button', { name: 'Tải MP4 / MOV / WEBM', exact: true }).click()
      await trainer.locator('#upload-file').setInputFiles({ name: 'technical-test.txt', mimeType: 'text/plain', buffer: Buffer.from('BrewForge automated technical test') })
      let invalidSent = false
      const listener = (request: import('@playwright/test').Request) => { if (request.method() === 'POST' && request.url().endsWith('/practical-videos')) invalidSent = true }
      trainer.on('request', listener)
      await trainer.getByRole('button', { name: 'Xác nhận', exact: true }).click()
      await expect(trainer.getByRole('dialog').locator('.error-box')).toBeVisible(); expect(invalidSent).toBe(false)
      trainer.off('request', listener)
      note('practical-file-type', 'Video invalid type', 'TXT rejected by FE before any upload; dialog remains recoverable', 'LIVE_UI', 'unhappy')
      stage = 'video upload UI'
      const existing = videos.find(video => video.uploadedBy === who.id && !video.evaluationId)
      if (!existing) {
        await trainer.locator('#upload-file').setInputFiles('e2e-private/final-fixtures/technical-test.webm')
        const uploaded = trainer.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/practical-videos'))
        await trainer.getByRole('button', { name: 'Xác nhận', exact: true }).click()
        const response = await uploaded; expect(response.status()).toBe(201)
        const data = await response.json(); m.ids.video = data.id; entity(m, 'practical video', data.id, 'UPLOADED', 'evaluate synthetic technical fixture')
      } else m.ids.video = existing.id
      await trainer.getByRole('dialog').locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
      note('practical-upload', 'Real WebM upload', 'Owner trainer uploaded verified VP8/WebM fixture via multipart UI; server persisted recording', 'LIVE_UI')
      stage = 'authenticated video playback'
      await trainer.getByRole('button', { name: 'Tải & xem bản ghi', exact: true }).last().click()
      const video = trainer.locator('video').last()
      await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(1)
      expect(await video.evaluate(async element => { const video = element as HTMLVideoElement; video.muted = true; await video.play(); await new Promise<void>(resolve => { video.onseeked = () => resolve(); video.currentTime = 1 }); video.pause(); return video.videoWidth === 640 && video.currentTime >= 0.9 })).toBe(true)
      for (const width of [1440, 768, 390, 360]) { await trainer.setViewportSize({ width, height: 1000 }); expect(await trainer.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true) }
      note('practical-playback', 'Authenticated video playback/layout', 'Bearer-protected blob loads, plays and seeks; four viewports fit', 'LIVE_UI')
      await trainer.setViewportSize({ width: 1440, height: 1000 })
      stage = 'evaluation UI'
      await trainer.locator('#evaluation-video').selectOption(String(m.ids.video))
      await trainer.getByRole('button', { name: 'Đánh giá thực hành', exact: true }).click()
      const dialog = trainer.getByRole('dialog')
      const marks = dialog.locator('select[id$=".passed"]')
      expect(await marks.count()).toBe(checklist.length)
      for (let i = 0; i < await marks.count(); i++) await marks.nth(i).selectOption('true')
      const notes = dialog.locator('textarea[id$=".note"]'); for (let i = 0; i < await notes.count(); i++) await notes.nth(i).fill('BrewForge automated technical test; synthetic video, not competency evidence')
      const evaluated = trainer.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/practical-evaluation'))
      await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).dblclick()
      const response = await evaluated; expect(response.status()).toBe(200)
      const data = await response.json(); expect(data.passed).toBe(true); expect(data.enrollmentState).toBe('PASSED'); expect(data.certificateId).toBeGreaterThan(0)
      m.ids.evaluation = data.id; m.ids.certificate = data.certificateId; entity(m, 'evaluation', data.id, 'PASSED'); entity(m, 'certificate', data.certificateId, 'VALID'); entity(m, 'enrollment', m.ids.enrollment, 'PASSED')
      await dialog.locator('footer').getByRole('button', { name: 'Đóng', exact: true }).click()
      note('practical-evaluate', 'Synthetic practical assessment', 'UI checklist submit yields PASSED enrollment and real certificate; technical test data only', 'LIVE_UI')
    }
    stage = 'certificate identity and F5'
    const trainee = await actors.login('TRAINEE')
    const learner = await identity(trainee)
    const certs = await api(trainee, 'Certificates.Mine')
    const matches = (certs.data as unknown as Record<string, unknown>[]).filter(c => c.enrollmentId === m.ids.enrollment && c.recipeVersionId === m.ids.version)
    expect(matches.length).toBe(1); const cert = matches[0]; m.ids.certificate = Number(cert.id); save(m)
    expect(cert.status).toBe('VALID'); expect(cert.userId).toBe(learner.id); expect(cert.assessedById).toBe(who.id)
    await trainee.goto('/barista/certificates'); await expect(trainee.locator('main h1').first()).toBeVisible(); await trainee.reload(); await expect(trainee.locator('main .error-box')).toHaveCount(0)
    const persisted = await api(trainer, 'Enrollments.Get', { id: m.ids.enrollment }); expect(persisted.data.state).toBe('PASSED')
    note('certificate-read', 'Certificate metadata/persistence', 'Exactly one VALID certificate matches version/enrollment/user/assessor; trainee page and F5 retain server result', 'LIVE_UI')
    stage = 'retraining closure'
    const auditor = await actors.login('QUALITY_AUDITOR')
    const action = await api(auditor, 'CorrectiveActions.Get', { id: m.ids.action })
    expect(action.data.branchAuditId).toBe(m.ids.audit)
    if (action.data.status !== 'CLOSED') {
      const closed = await api(auditor, 'CorrectiveActions.Close', { id: m.ids.action }, { note: m.runId + ' automated technical test completed current enrollment' })
      expect(closed.ok).toBe(true); expect(closed.data.status).toBe('CLOSED')
    }
    entity(m, 'corrective action', m.ids.action, 'CLOSED')
    note('retraining-close', 'Retraining to close', 'Action that previously returned RETRAINING_INCOMPLETE now closes after current run enrollment truly PASSED; action predates this new pass')
  } catch {
    record(m, 'failure', { flow: stage, role: 'TRAINER/TRAINEE', kind: 'diagnostic', via: 'LIVE_UI/API', status: 'FAIL', assertion: 'Sanitized failure at ' + stage, evidence: 'No payload or DOM capture' })
    throw new Error('Sanitized final-flow failure at ' + stage)
  } finally { await actors.close() }
})
