import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { dashboardPath } from '@/constants/roles'
import type { Role } from './authTypes'
export function RoleBasedRoute({ allowedRoles }: { allowedRoles: readonly Role[] }) {
  const user = useAppSelector((state) => state.auth.user)
  if (!user) return <Navigate to="/login" replace />
  return allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to={dashboardPath(user.role)} replace />
}
