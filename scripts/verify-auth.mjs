import assert from 'node:assert/strict'
import { createServer } from 'vite'

// Load the real TypeScript modules through Vite, with the same aliases/env handling.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { store } = await server.ssrLoadModule('/src/app/store.ts')
  const { login, logout } = await server.ssrLoadModule('/src/features/auth/authSlice.ts')
  const { mockAuthService, demoUsers, DEMO_PASSWORD } = await server.ssrLoadModule('/src/features/auth/mockAuthService.ts')
  const { ROLES } = await server.ssrLoadModule('/src/features/auth/authTypes.ts')
  const { roleConfig } = await server.ssrLoadModule('/src/constants/roles.ts')
  const { apiClient, configureApiAuth } = await server.ssrLoadModule('/src/services/apiClient.ts')
  const { normalizeApiError } = await server.ssrLoadModule('/src/services/apiError.ts')
  assert.equal(new Set(Object.values(roleConfig).map((role) => role.prefix)).size, 7)
  assert.equal(demoUsers.length, ROLES.length)
  for (const user of demoUsers) {
    const result = await store.dispatch(login({ email: user.email, password: DEMO_PASSWORD }))
    assert.equal(login.fulfilled.match(result), true)
    assert.equal(store.getState().auth.user.role, user.role)
    assert.equal(store.getState().auth.isAuthenticated, true)
    assert.equal(store.getState().auth.loading, false)
  }
  store.dispatch(logout())
  assert.equal(store.getState().auth.accessToken, null)
  assert.equal(store.getState().auth.user, null)
  await store.dispatch(login({ email: demoUsers[0].email, password: 'wrong' }))
  assert.equal(store.getState().auth.isAuthenticated, false)
  assert.match(store.getState().auth.error, /Invalid demo/)
  await assert.rejects(mockAuthService.login({ email: 'unknown@example.test', password: DEMO_PASSWORD }))
  configureApiAuth(() => 'test-access-token', () => { store.dispatch(logout()) })
  await apiClient.get('/verify', { baseURL: 'https://example.invalid', adapter: async (config) => {
    assert.equal(config.headers.get('Authorization'), 'Bearer test-access-token')
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  } })
  const problem = normalizeApiError({ isAxiosError: true, response: { status: 400, data: { title: 'Validation failed', errors: { email: ['Required'] } } } })
  assert.equal(problem.status, 400)
  assert.deepEqual(problem.validationErrors, { email: ['Required'] })
  await store.dispatch(login({ email: demoUsers[0].email, password: DEMO_PASSWORD }))
  await assert.rejects(apiClient.get('/verify', { baseURL: 'https://example.invalid', adapter: async () => {
    throw { isAxiosError: true, response: { status: 401, data: { title: 'Unauthorized' } } }
  } }), /Unauthorized/)
  assert.equal(store.getState().auth.isAuthenticated, false)
  console.log('Passed: seven-role login/switching, invalid login, logout, unique route prefixes, bearer injection, ProblemDetails, and 401 session expiry.')
} finally {
  await server.close()
}
