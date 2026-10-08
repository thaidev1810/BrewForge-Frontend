import { Navigate, Link } from 'react-router-dom'
import { lazy } from 'react'
import { useAppSelector } from '@/app/hooks'
import { dashboardPath } from '@/constants/roles'
export const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((module) => ({ default: module.LoginPage })))
export function HomeRedirect() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  return <Navigate to={isAuthenticated && user ? dashboardPath(user.role) : '/login'} replace />
}
export function NotFound() { return <main className="p-10"><h1 className="text-2xl font-semibold">Page not found</h1><Link to="/" className="mt-4 inline-block underline">Back to your workspace</Link></main> }
export function RouteError() { return <main className="p-10"><h1 className="text-2xl font-semibold">Unable to open this page</h1><a href="/" className="mt-4 inline-block underline">Reload your workspace</a></main> }
