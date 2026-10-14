import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { normalizeApiError } from '@/services/apiError'
import { apiClient } from '@/services/apiClient'
import { authService } from './authService'
import type { AuthSession, AuthState, LoginCredentials } from './authTypes'
const initialState: AuthState = { user: null, accessToken: null, refreshToken: null, isAuthenticated: false, loading: false, error: null, requestId: null, generation: 0 }
export const login = createAsyncThunk<AuthSession, LoginCredentials, { rejectValue: string }>('auth/login', async (credentials, { rejectWithValue }) => {
  try { return await authService.login(credentials) } catch (error) { return rejectWithValue(normalizeApiError(error).message) }
})
export const signOut = createAsyncThunk<void, void, { state: { auth: AuthState } }>('auth/signOut', async (_, { getState, dispatch }) => {
  const refreshToken = getState().auth.refreshToken
  try { if (refreshToken) await apiClient.post('/auth/logout', { refreshToken }) } finally { dispatch(logout()) }
})
const slice = createSlice({ name: 'auth', initialState, reducers: {
  logout: state => ({ ...initialState, generation: state.generation + 1 }),
  clearAuthError: state => { state.error = null },
  sessionRotated: (state, action: PayloadAction<AuthSession>) => { if (state.isAuthenticated) Object.assign(state, action.payload) },
}, extraReducers: builder => {
  builder.addCase(login.pending, (state, action) => { state.loading = true; state.error = null; state.requestId = action.meta.requestId })
    .addCase(login.fulfilled, (state, action) => {
      if (state.requestId !== action.meta.requestId) return
      Object.assign(state, action.payload, { isAuthenticated: true, loading: false, requestId: null, generation: state.generation + 1 })
    }).addCase(login.rejected, (state, action) => {
      if (state.requestId !== action.meta.requestId) return
      state.loading = false; state.requestId = null; state.error = action.payload ?? 'Không đăng nhập được.'
    })
} })
export const { logout, clearAuthError, sessionRotated } = slice.actions
export default slice.reducer
