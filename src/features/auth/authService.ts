import { isDemoMode } from '@/constants/config'
import { apiClient } from '@/services/apiClient'
import { mockAuthService } from './mockAuthService'
import type { AuthService, AuthSession } from './authTypes'

const realAuthService: AuthService = {
  async login(credentials) {
    // Contract boundary: adjust this endpoint/DTO when the .NET API is connected.
    const { data } = await apiClient.post<AuthSession>('/auth/login', credentials)
    return data
  },
}
export const authService: AuthService = isDemoMode ? mockAuthService : realAuthService
