import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
export function ProtectedRoute() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const location = useLocation()
  return isAuthenticated && user ? <Outlet /> : <Navigate to="/login" state={{ from: location.pathname }} replace />
}
