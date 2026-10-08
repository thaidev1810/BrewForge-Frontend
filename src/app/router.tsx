import { createBrowserRouter, Navigate } from 'react-router-dom'
import { HomeRedirect, NotFound, RouteError, LoginPage } from '@/components/common/RoutePages'
import { ROLES } from '@/features/auth/authTypes'
import { PublicRoute } from '@/features/auth/PublicRoute'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RoleBasedRoute } from '@/features/auth/RoleBasedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RoleDashboard } from '@/components/common/RoleDashboard'
import { roleConfig } from '@/constants/roles'


export const router = createBrowserRouter([{
  errorElement: <RouteError />,
  children: [
    { path: '/', element: <HomeRedirect /> },
    { element: <PublicRoute />, children: [{ path: '/login', element: <LoginPage /> }] },
    { element: <ProtectedRoute />, children: ROLES.map((role) => ({
      path: roleConfig[role].prefix, element: <RoleBasedRoute allowedRoles={[role]} />,
      children: [{ element: <DashboardLayout />, children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: 'dashboard', element: <RoleDashboard role={role} /> },
      ] }],
    })) },
    { path: '*', element: <NotFound /> },
  ],
}])
