import { test, expect } from '@playwright/test'
import { Actors, api, entity, manifest, record, save } from './harness.js'

test('read-only checkpoint and protected-media live UI retest after shared fix', async ({ browser }, info) => {
  test.setTimeout(75_000)
  const m = manifest(), actors = new Actors(browser, String(info.project.use.baseURL)); let stage = 'checkpoint'
  try {
    const trainer = await actors.login('TRAINER'), rd = await actors.login('RD_MANAGER'), qa = await actors.login('QUALITY_AUDITOR')
    const enrollment = await api(trainer, 'Enrollments.Get', { id: m.ids.enrollment }); expect(enrollment.data.state).toBe('PASSED')
    const certificate = await api(trainer, 'Certificates.Get', { id: m.ids.certificate }); expect(certificate.data.status).toBe('VALID'); expect(certificate.data.enrollmentId).toBe(m.ids.enrollment); expect(certificate.data.recipeVersionId).toBe(m.ids.version); expect(typeof certificate.data.issuedBy).toBe('string')
    const action = await api(qa, 'CorrectiveActions.Get', { id: m.ids.action }); expect(action.data.status).toBe('CLOSED')
    const launches = await api(rd, 'BranchLaunchStatus.List', {}, undefined, { recipeId: m.ids.recipe, branchId: m.ids.branch })
    const launch = (launches.data as unknown as { status: string; coverageMet: boolean; certifiedCount: number }[])[0]; expect(launch.status).toBe('LIVE'); expect(launch.coverageMet).toBe(true); expect(launch.certifiedCount).toBeGreaterThanOrEqual(2)
    const pilot = await api(rd, 'Pilots.Get', { id: m.ids.pilot }); expect(pilot.data.state).toBe('RUNNING')
    m.refs ??= {}; m.refs.pilotStartDate = String(pilot.data.startDate); m.refs.pilotEndDate = String(pilot.data.endDate)
    entity(m, 'pilot', m.ids.pilot, 'RUNNING', 'LIVE coverage2 confirmed; wait for actual EndDate ' + m.refs.pilotEndDate + ' before final decision')
    entity(m, 'practical video', m.ids.video, 'UPLOADED; used by PASSED evaluation1', '')
    const utility = await api(trainer, 'Courses.Get', { id: m.ids.utility_course }); expect(utility.data.state).toBe('PUBLISHED')
    entity(m, 'course', m.ids.utility_course, 'PUBLISHED owned upload-guard course')
    save(m)
    record(m, 'checkpoint-retest', { flow: 'Persisted final checkpoint', role: 'test actors', kind: 'happy', via: 'LIVE_API', status: 'PASS_LIVE_API', assertion: 'Original PASSED enrollment/VALID certificate metadata/CLOSED action/LIVE launch coverage2 remain after auxiliary flows', evidence: 'Real scoped GETs; no mutations' })
    stage = 'direct practical copy'
    await trainer.goto('/trainer/assessment/' + m.ids.enrollment)
    await expect(trainer.getByText('Với khóa được giao trực tiếp, giảng viên khác người học có thể tải bản ghi thực hành.', { exact: false })).toBeVisible()
    record(m, 'direct-practical-notice', { flow: 'Direct-assignment practical UX', role: 'TRAINER', kind: 'happy', via: 'LIVE_UI', status: 'PASS_LIVE_UI', assertion: 'Notice explains direct enrollment separately from class ownership; no false class prerequisite added', evidence: 'Original enrollment12 live UI' })
    stage = 'media source switch'
    const recordings = await api(trainer, 'Enrollments.PracticalVideos', { id: m.ids.secondaryEnrollment })
    const second = (recordings.data as unknown as { id: number }[])[0]
    expect(second.id).not.toBe(m.ids.video)
    await trainer.goto('/trainer/videos/' + m.ids.video)
    await trainer.getByRole('button', { name: 'Tải & xem bản ghi', exact: true }).click(); await expect(trainer.locator('video')).toHaveCount(1)
    await trainer.evaluate(path => { history.pushState({ idx: Number(history.state?.idx ?? 0) + 1, key: 'owned-media-test' }, '', path); dispatchEvent(new PopStateEvent('popstate', { state: history.state })) }, '/trainer/videos/' + second.id)
    await expect(trainer.locator('video')).toHaveCount(0); await expect(trainer.getByRole('button', { name: 'Tải & xem bản ghi', exact: true })).toBeVisible()
    await trainer.getByRole('button', { name: 'Tải & xem bản ghi', exact: true }).click()
    await expect.poll(() => trainer.locator('video').evaluate(element => (element as HTMLVideoElement).videoWidth)).toBe(640)
    await trainer.setViewportSize({ width: 360, height: 900 }); expect(await trainer.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    record(m, 'media-source-switch', { flow: 'Protected media stale source regression', role: 'TRAINER', kind: 'unhappy', via: 'LIVE_UI', status: 'PASS_LIVE_UI', assertion: 'Switching between two actual owned recordings clears old video, requires new authenticated load and decodes new source; mobile360 fits', evidence: 'Real GETs, synthetic owned video files; isolated reproduction also passed' })
    stage = 'server byte range'
    const range = await trainer.evaluate(async id => {
      const { store, bootstrapAuth } = await import(/* @vite-ignore */ String('/src/app/store.ts')); await bootstrapAuth()
      const { routeFor } = await import(/* @vite-ignore */ String('/src/services/backend/operations.ts'))
      const { apiBaseUrl } = await import(/* @vite-ignore */ String('/src/constants/config.ts'))
      const response = await fetch(apiBaseUrl + routeFor({ operation: 'Enrollments.PracticalVideoContent', params: { id } }), { headers: { Authorization: 'Bearer ' + store.getState().auth.accessToken, Range: 'bytes=0-99' } })
      return { status: response.status, rangeExposed: !!response.headers.get('Content-Range'), bytes: (await response.arrayBuffer()).byteLength }
    }, m.ids.video)
    expect(range.status).toBe(206); expect(range.bytes).toBe(100); expect(range.rangeExposed).toBe(true)
    record(m, 'video-byte-range', { flow: 'Authenticated server range', role: 'TRAINER', kind: 'happy', via: 'LIVE_API', status: 'PASS_LIVE_API', assertion: 'Real Range bytes=0-99 returns206/100 bytes; Content-Range exposed by CORS, distinct from blob UI seek', evidence: 'Only status/count booleans persisted; no Authorization value' })
    stage = 'interim pilot evaluation'
    const interim = await api(rd, 'Pilots.Evaluation', { id: m.ids.pilot }); expect(interim.ok).toBe(true); expect(interim.data.state).toBe('RUNNING')
    const branch = (interim.data.byBranch as { branchId: number; cupsTotal: number }[]).find(row => row.branchId === m.ids.branch)!
    expect(branch.cupsTotal).toBe(11)
    record(m, 'pilot-interim', { flow: 'Interim pilot evaluation', role: 'RD_MANAGER', kind: 'happy', via: 'LIVE_API', status: 'PASS_LIVE_API', assertion: 'RUNNING pilot evaluates actual owned sales11 cups; this is interim, not ended scheduler or final decision proof', evidence: 'State RUNNING and branch cupsTotal11' })
  } catch { record(m, 'retest-failure', { flow: stage, role: 'test actors', kind: 'diagnostic', via: 'LIVE_UI/API', status: 'FAIL', assertion: 'Sanitized retest failure at ' + stage, evidence: 'No response payload retained' }); throw new Error('Sanitized retest failure at ' + stage) }
  finally { await actors.close() }
})
