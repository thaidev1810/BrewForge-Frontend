import { RoleNameValues, type MeResponse } from '@/services/backend/contracts'
export const ROLES = RoleNameValues
export type Role = typeof ROLES[number]
// Preserve existing UI identity conventions; request/response wire types are exact in contracts.ts.
export interface User { id: string; name: string; email: string; role: Role; branchId: string | null; username?: string; permissions?: string[] }
export interface AuthSession { user: User; accessToken: string; refreshToken: string }
export interface LoginCredentials { username: string; password: string }
export interface AuthState { user: User | null; accessToken: string | null; refreshToken: string | null; isAuthenticated: boolean; loading: boolean; error: string | null; requestId: string | null; generation: number; status: 'initializing' | 'authenticated' | 'unauthenticated'; bootstrapError: string | null }
export interface AuthService { login(credentials: LoginCredentials): Promise<AuthSession> }
export function identityFromWire(me: MeResponse): User {
  if (!ROLES.includes(me.role) || !Number.isSafeInteger(me.id) || me.status !== 'ACTIVE') throw new Error('Tài khoản hoặc role trả về không hợp lệ.')
  return { id: String(me.id), username: me.username, name: me.fullName, email: me.email, role: me.role, branchId: me.branchId === null ? null : String(me.branchId), permissions: me.permissions }
}
