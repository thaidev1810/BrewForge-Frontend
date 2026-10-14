import { authTransport } from '@/services/apiClient'
import type { LoginResponse, MeResponse } from '@/services/backend/contracts'
import { identityFromWire, type AuthService } from './authTypes'
export const authService: AuthService = { async login(credentials) {
  const { data } = await authTransport.post<LoginResponse>('/auth/login', credentials)
  const me = await authTransport.get<MeResponse>('/auth/me', { headers: { Authorization: `Bearer ${data.accessToken}` } })
  return { user: identityFromWire(me.data), accessToken: data.accessToken, refreshToken: data.refreshToken }
} }
