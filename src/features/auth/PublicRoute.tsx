import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { authDestination } from './authRedirect'
export function PublicRoute() {
  const { isAuthenticated, user, status } = useAppSelector((state) => state.auth), location = useLocation()
  if (status === 'initializing') return <p role="status">Đang khôi phục phiên đăng nhập…</p>
  return isAuthenticated && user ? <Navigate to={authDestination(location.state?.from, user.role)} replace /> : <Outlet />
}
