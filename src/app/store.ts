import { refreshUncertain, markRefreshUncertain, clearRefreshUncertain } from '@/features/auth/refreshRecovery'
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import authReducer, { logout, restoring, tokensRotated, sessionVerified, restoreFailed, restoreEmpty } from '@/features/auth/authSlice'
import { apiClient, authTransport, configureApiAuth } from '@/services/apiClient'
import { readStoredSession, writeStoredSession } from '@/features/auth/sessionStorage'
import { ApiError, normalizeApiError } from '@/services/apiError'
import { identityFromWire } from '@/features/auth/authTypes'
import type { LoginResponse, MeResponse } from '@/services/backend/contracts'
import { backendApi } from '@/services/backend/operations'
import productsReducer from '@/features/products/productSlice'
import recipesReducer from '@/features/recipes/recipeSlice'
import sopsReducer from '@/features/sops/sopSlice'
import coursesReducer from '@/features/courses/courseSlice'
import trainingReducer from '@/features/training/trainingSlice'
import quizzesReducer from '@/features/quizzes/quizSlice'
import assessmentsReducer from '@/features/assessments/assessmentSlice'
import certificatesReducer from '@/features/certificates/certificateSlice'
import branchesReducer from '@/features/branches/branchSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    recipes: recipesReducer,
    sops: sopsReducer,
    courses: coursesReducer,
    training: trainingReducer,
    quizzes: quizzesReducer,
    assessments: assessmentsReducer,
    certificates: certificatesReducer,
    branches: branchesReducer,
    [backendApi.reducerPath]: backendApi.reducer,
  },
  middleware: getDefault => getDefault().concat(backendApi.middleware),
})
configureApiAuth(() => store.getState().auth.accessToken, () => { store.dispatch(logout()) }, async () => {
  const before = store.getState().auth
  if (!before.refreshToken) throw new ApiError('Phiên đăng nhập đã hết hạn.', 401)
  if (refreshUncertain()) throw new ApiError('Không xác định được lần làm mới trước đã hoàn tất hay chưa. Token dùng một lần không thể khôi phục; hãy xóa phiên và đăng nhập lại.')
  let data: LoginResponse
  try { ({ data } = await authTransport.post<LoginResponse>('/auth/refresh', { refreshToken: before.refreshToken })) }
  catch (error) {
    if (store.getState().auth.generation === before.generation && normalizeApiError(error).status === undefined) {
      markRefreshUncertain()
      store.dispatch(restoreFailed({ generation: before.generation, message: 'Mất kết nối khi làm mới phiên; máy chủ có thể đã đổi token. Hãy xóa phiên và đăng nhập lại.' }))
    }
    throw error
  }
  if (store.getState().auth.generation !== before.generation) throw new ApiError('Phiên đăng nhập đã thay đổi.', 401)
  clearRefreshUncertain()
  // Save the rotated pair before /me: the old refresh token is already revoked by BE.
  store.dispatch(tokensRotated({ generation: before.generation, tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken } }))
  if (before.status === 'authenticated') {
    try {
      const me = await authTransport.get<MeResponse>('/auth/me', { headers: { Authorization: `Bearer ${data.accessToken}` } })
      if (store.getState().auth.generation !== before.generation) throw new ApiError('Phiên đăng nhập đã thay đổi.', 401)
      store.dispatch(sessionVerified({ generation: before.generation, user: identityFromWire(me.data) }))
    } catch (error) {
      if (normalizeApiError(error).status !== 401) store.dispatch(restoreFailed({ generation: before.generation, message: normalizeApiError(error).message }))
      throw error
    }
  }
  return data.accessToken
}, () => store.getState().auth.generation)
setupListeners(store.dispatch)
let generation = store.getState().auth.generation
let savedTokens = ''
store.subscribe(() => {
  const auth = store.getState().auth, current = auth.generation
  const signature = JSON.stringify([auth.accessToken, auth.refreshToken])
  if (signature !== savedTokens || current !== generation && !auth.accessToken) {
    if (!auth.accessToken) clearRefreshUncertain()
    savedTokens = signature
    writeStoredSession(auth.accessToken && auth.refreshToken ? { accessToken: auth.accessToken, refreshToken: auth.refreshToken } : null)
  }
  if (current !== generation) { generation = current; store.dispatch(backendApi.util.resetApiState()) }
})
let bootstrap: { generation: number; promise: Promise<void> } | null = null
export function bootstrapAuth(): Promise<void> {
  const before = store.getState().auth
  if (before.status === 'authenticated') return Promise.resolve()
  if (bootstrap?.generation === before.generation) return bootstrap.promise
  const tokens = before.accessToken && before.refreshToken ? { accessToken: before.accessToken, refreshToken: before.refreshToken } : readStoredSession()
  if (!tokens) { store.dispatch(restoreEmpty(before.generation)); return Promise.resolve() }
  store.dispatch(restoring({ generation: before.generation, tokens }))
  const run = { generation: before.generation, promise: Promise.resolve() }
  bootstrap = run
  run.promise = (async () => {
    try {
      const { data } = await apiClient.get<MeResponse>('/auth/me')
      store.dispatch(sessionVerified({ generation: before.generation, user: identityFromWire(data) }))
    } catch (error) {
      if (store.getState().auth.generation !== before.generation) return
      const refusal = normalizeApiError(error)
      if (refusal.status === 401) store.dispatch(logout())
      else store.dispatch(restoreFailed({ generation: before.generation, message: refusal.message }))
    } finally { if (bootstrap === run) bootstrap = null }
  })()
  return run.promise
}
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
