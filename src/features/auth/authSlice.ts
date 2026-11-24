import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { normalizeApiError } from '@/services/apiError'
import { authService } from './authService'
import { ROLES, type AuthSession, type AuthState, type LoginCredentials } from './authTypes'

const STORAGE_KEY = 'brewforge.auth.session'

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.accessToken || !parsed?.user?.role || !ROLES.includes(parsed.user.role)) return null
    return parsed
  } catch {
    return null
  }
}

function writeStoredSession(session: AuthSession | null) {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return
  try {
    if (!session) window.sessionStorage.removeItem(STORAGE_KEY)
    else window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Ignore storage quota / privacy mode errors.
  }
}

const emptyState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

const stored = readStoredSession()
const initialState: AuthState = stored
  ? {
      user: stored.user,
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken ?? null,
      isAuthenticated: true,
      loading: false,
      error: null,
    }
  : emptyState

export const login = createAsyncThunk<AuthSession, LoginCredentials, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials)
    } catch (error) {
      return rejectWithValue(normalizeApiError(error).message)
    }
  },
)

export const signOut = createAsyncThunk<void, void, { state: { auth: AuthState } }>(
  'auth/signOut',
  async (_, { getState, dispatch }) => {
    const refreshToken = getState().auth.refreshToken
    dispatch(logout())
    if (refreshToken && authService.logout) {
      try {
        await authService.logout(refreshToken)
      } catch {
        // Session is already cleared locally.
      }
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: () => {
      writeStoredSession(null)
      return emptyState
    },
    clearAuthError: (state) => {
      state.error = null
    },
    sessionRefreshed: (state, action: PayloadAction<AuthSession>) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken ?? null
      state.isAuthenticated = true
      state.error = null
      writeStoredSession(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        if (!state.loading) return // Ignore a response after logout or session expiry.
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken ?? null
        state.isAuthenticated = true
        state.loading = false
        writeStoredSession(action.payload)
      })
      .addCase(login.rejected, (state, action) => {
        if (!state.loading) return
        state.loading = false
        state.error = action.payload ?? 'Unable to sign in.'
      })
  },
})

export const { logout, clearAuthError, sessionRefreshed } = authSlice.actions
export default authSlice.reducer
