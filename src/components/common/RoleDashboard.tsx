import { RoleTaskBoard } from './RoleTaskBoard'
import type { Role } from '@/features/auth/authTypes'
export function RoleDashboard({ role }: { role: Role }) { return <RoleTaskBoard role={role} /> }
