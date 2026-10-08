import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { normalizeApiError } from '@/services/apiError'
import { authService } from './authService'
import type { AuthSession, AuthState, LoginCredentials } from './authTypes'

const initialState: AuthState = { user: null, accessToken: null, isAuthenticated: false, loading: false, error: null }
export const login = createAsyncThunk<AuthSession, LoginCredentials, { rejectValue: string }>(
  'auth/login', async (credentials, { rejectWithValue }) => {
    try { return await authService.login(credentials) }
    catch (error) { return rejectWithValue(normalizeApiError(error).message) }
  },
)
const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: { logout: () => initialState, clearAuthError: (state) => { state.error = null } },
  extraReducers: (builder) => {
    builder.addCase(login.pending, (state) => { state.loading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        if (!state.loading) return // Ignore a response after logout or session expiry.
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
        state.loading = false
      })
      .addCase(login.rejected, (state, action) => {
        if (!state.loading) return
        state.loading = false
        state.error = action.payload ?? 'Unable to sign in.'
      })
  },
})
export const { logout, clearAuthError } = authSlice.actions
export default authSlice.reducer
