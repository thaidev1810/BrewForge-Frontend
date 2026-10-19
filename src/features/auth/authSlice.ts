import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { normalizeApiError } from '@/services/apiError'
import { authTransport } from '@/services/apiClient'
import { authService } from './authService'
import type { AuthSession, AuthState, LoginCredentials, User } from './authTypes'
import type { TokenPair } from './sessionStorage'
const initialState: AuthState = { user: null, accessToken: null, refreshToken: null, isAuthenticated: false, loading: false, error: null, requestId: null, generation: 0, status: 'initializing', bootstrapError: null }
export const login = createAsyncThunk<AuthSession, LoginCredentials, { rejectValue: string }>('auth/login', async (credentials, { rejectWithValue }) => {
  try { return await authService.login(credentials) } catch (error) { return rejectWithValue(normalizeApiError(error).message) }
})
export const signOut = createAsyncThunk<void, void, { state: { auth: AuthState } }>('auth/signOut', async (_, { getState, dispatch }) => {
  const { refreshToken, accessToken } = getState().auth
  dispatch(logout())
  if (refreshToken && accessToken) await authTransport.post('/auth/logout', { refreshToken }, { headers: { Authorization: `Bearer ${accessToken}` } })
})
const slice = createSlice({ name: 'auth', initialState, reducers: {
  logout: state => ({ ...initialState, status: 'unauthenticated', generation: state.generation + 1 }),
  clearAuthError: state => { state.error = null },
  sessionRotated: (state, action: PayloadAction<AuthSession>) => { if (state.isAuthenticated) Object.assign(state, action.payload) },
  restoring: (state, { payload }: PayloadAction<{ generation: number; tokens: TokenPair }>) => { if (state.generation === payload.generation) Object.assign(state, payload.tokens, { status: 'initializing', isAuthenticated: false, bootstrapError: null }) },
  tokensRotated: (state, { payload }: PayloadAction<{ generation: number; tokens: TokenPair }>) => { if (state.generation === payload.generation) Object.assign(state, payload.tokens) },
  sessionVerified: (state, { payload }: PayloadAction<{ generation: number; user: User }>) => {
    if (state.generation !== payload.generation) return
    if (!state.isAuthenticated || state.user?.id !== payload.user.id || state.user?.role !== payload.user.role || state.user?.branchId !== payload.user.branchId || JSON.stringify(state.user?.permissions) !== JSON.stringify(payload.user.permissions)) state.generation++
    Object.assign(state, { user: payload.user, isAuthenticated: true, status: 'authenticated', bootstrapError: null })
  },
  restoreFailed: (state, { payload }: PayloadAction<{ generation: number; message: string }>) => { if (state.generation === payload.generation) Object.assign(state, { status: 'initializing', isAuthenticated: false, bootstrapError: payload.message }) },
  restoreEmpty: (state, { payload }: PayloadAction<number>) => { if (state.generation === payload) Object.assign(state, { status: 'unauthenticated', isAuthenticated: false, bootstrapError: null }) },
}, extraReducers: builder => {
  builder.addCase(login.pending, (state, action) => { Object.assign(state, initialState, { generation: state.generation + 1, status: 'unauthenticated', loading: true, requestId: action.meta.requestId }) })
    .addCase(login.fulfilled, (state, action) => {
      if (state.requestId !== action.meta.requestId) return
      Object.assign(state, action.payload, { isAuthenticated: true, status: 'authenticated', bootstrapError: null, loading: false, requestId: null, generation: state.generation + 1 })
    }).addCase(login.rejected, (state, action) => {
      if (state.requestId !== action.meta.requestId) return
      state.loading = false; state.requestId = null; state.error = action.payload ?? 'Không đăng nhập được.'
    })
} })
export const { logout, clearAuthError, sessionRotated, restoring, tokensRotated, sessionVerified, restoreFailed, restoreEmpty } = slice.actions
export default slice.reducer
