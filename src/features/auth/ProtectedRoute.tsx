import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
export function ProtectedRoute() {
  const { isAuthenticated, user, status } = useAppSelector((state) => state.auth)
  const location = useLocation()
  if (status === 'initializing') return <p role="status">Đang khôi phục phiên đăng nhập…</p>
  return isAuthenticated && user ? <Outlet /> : <Navigate to="/login" state={{ from: location.pathname + location.search + location.hash }} replace />
}
