export const ROLES = ['ADMIN', 'RD_SPECIALIST', 'RD_MANAGER', 'TRAINER', 'STORE_MANAGER', 'BARISTA', 'QUALITY_AUDITOR'] as const
export type Role = typeof ROLES[number]

export interface User {
  id: string
  name: string
  email: string
  role: Role
  branchId: string | null
}
export interface AuthSession { user: User; accessToken: string }
export interface LoginCredentials { email: string; password: string }
export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}
export interface AuthService { login(credentials: LoginCredentials): Promise<AuthSession> }
