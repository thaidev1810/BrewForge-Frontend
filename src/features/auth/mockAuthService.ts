import { ROLES, type AuthService, type User } from './authTypes'
import { ApiError } from '@/services/apiError'

export const DEMO_PASSWORD = 'BrewForge123!'

export const demoUsers: User[] = ROLES.map((role, index) => ({
  id: `demo-${index + 1}`,
  numericId: index + 1,
  username: role.toLowerCase(),
  name: `Demo ${role.toLowerCase().replaceAll('_', ' ')}`,
  email: `${role.toLowerCase()}@demo.brewforge.test`,
  role,
  branchId: role === 'TRAINEE' || role === 'BRANCH_MANAGER' ? 'demo-branch-1' : null,
  numericBranchId: role === 'TRAINEE' || role === 'BRANCH_MANAGER' ? 1 : null,
}))

export const mockAuthService: AuthService = {
  async login({ username, email, password }) {
    const identifier = (username ?? email ?? '').trim().toLowerCase()
    const user = demoUsers.find(
      (item) => item.email.toLowerCase() === identifier || item.username?.toLowerCase() === identifier,
    )
    if (!user || password !== DEMO_PASSWORD) throw new ApiError('Invalid demo email or password.', 401)
    return { user: { ...user }, accessToken: `demo-token-${user.id}`, refreshToken: null }
  },
  async logout() {
    return undefined
  },
  async me() {
    const first = demoUsers[0]
    return {
      id: first.numericId ?? 1,
      username: first.username ?? 'admin',
      email: first.email,
      fullName: first.name,
      role: first.role,
      branchId: first.numericBranchId ?? null,
      status: 'ACTIVE',
      permissions: ['*'],
    }
  },
  async changePassword(currentPassword, newPassword) {
    if (currentPassword !== DEMO_PASSWORD) throw new ApiError('Current password is incorrect.', 400)
    if (newPassword.length < 8) throw new ApiError('New password must be at least 8 characters.', 400)
  },
}
