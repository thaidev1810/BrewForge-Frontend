import { isDemoMode } from '@/constants/config'
import { apiClient } from '@/services/apiClient'
import { mockAuthService } from './mockAuthService'
import type { AuthService, AuthSession, MeProfile, Role, User } from './authTypes'

interface BackendUserDto {
  id: number
  username: string
  email: string
  fullName: string
  role: Role
  branchId: number | null
  status: string
  createdAt?: string
}

interface BackendLoginResponse {
  accessToken: string
  refreshToken: string
  user: BackendUserDto
}

export function mapBackendUser(dto: BackendUserDto, permissions?: string[]): User {
  return {
    id: String(dto.id),
    numericId: dto.id,
    username: dto.username,
    name: dto.fullName || dto.username,
    email: dto.email,
    role: dto.role,
    branchId: dto.branchId != null ? String(dto.branchId) : null,
    numericBranchId: dto.branchId,
    status: dto.status,
    permissions,
  }
}

function mapLoginResponse(data: BackendLoginResponse): AuthSession {
  return {
    user: mapBackendUser(data.user),
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  }
}

const realAuthService: AuthService = {
  async login(credentials) {
    const username = (credentials.username || credentials.email || '').trim()
    const { data } = await apiClient.post<BackendLoginResponse>('/auth/login', {
      username,
      password: credentials.password,
    })
    return mapLoginResponse(data)
  },
  async refresh(refreshToken) {
    const { data } = await apiClient.post<BackendLoginResponse>('/auth/refresh', { refreshToken })
    return mapLoginResponse(data)
  },
  async logout(refreshToken) {
    if (!refreshToken) return
    await apiClient.post('/auth/logout', { refreshToken })
  },
  async me() {
    const { data } = await apiClient.get<MeProfile>('/auth/me')
    return data
  },
  async changePassword(currentPassword, newPassword) {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword })
  },
}

export const authService: AuthService = isDemoMode ? mockAuthService : realAuthService
