import { configureStore } from '@reduxjs/toolkit'
import authReducer, { logout, sessionRotated } from '@/features/auth/authSlice'
import { authTransport, configureApiAuth } from '@/services/apiClient'
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
  if (!before.refreshToken) throw new Error('Phiên đăng nhập đã hết hạn.')
  const { data } = await authTransport.post<LoginResponse>('/auth/refresh', { refreshToken: before.refreshToken })
  const me = await authTransport.get<MeResponse>('/auth/me', { headers: { Authorization: `Bearer ${data.accessToken}` } })
  if (store.getState().auth.generation !== before.generation) throw new Error('Phiên đăng nhập đã thay đổi.')
  const user = identityFromWire(me.data)
  if (user.role !== before.user?.role || user.branchId !== before.user?.branchId) {
    store.dispatch(logout())
    throw new Error('Quyền tài khoản đã thay đổi. Vui lòng đăng nhập lại.')
  }
  store.dispatch(sessionRotated({ user, accessToken: data.accessToken, refreshToken: data.refreshToken }))
  return data.accessToken
}, () => store.getState().auth.generation)
let generation = store.getState().auth.generation
store.subscribe(() => {
  const current = store.getState().auth.generation
  if (current !== generation) { generation = current; store.dispatch(backendApi.util.resetApiState()) }
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
