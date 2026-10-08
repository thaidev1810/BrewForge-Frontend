import { ROLES, type AuthService, type User } from './authTypes'
import { ApiError } from '@/services/apiError'

export const DEMO_PASSWORD = 'BrewForge123!'
export const demoUsers: User[] = ROLES.map((role, index) => ({
  id: `demo-${index + 1}`, name: `Demo ${role.toLowerCase().replaceAll('_', ' ')}`,
  email: `${role.toLowerCase()}@demo.brewforge.test`, role,
  branchId: role === 'BARISTA' || role === 'STORE_MANAGER' ? 'demo-branch-1' : null,
}))
export const mockAuthService: AuthService = {
  async login({ email, password }) {
    const user = demoUsers.find((item) => item.email === email.trim().toLowerCase())
    if (!user || password !== DEMO_PASSWORD) throw new ApiError('Invalid demo email or password.')
    return { user: { ...user }, accessToken: `demo-token-${user.id}` }
  },
}
