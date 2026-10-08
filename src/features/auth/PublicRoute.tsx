import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { dashboardPath } from '@/constants/roles'
export function PublicRoute() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  return isAuthenticated && user ? <Navigate to={dashboardPath(user.role)} replace /> : <Outlet />
}
