import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { isDemoMode } from '@/constants/config'
import { dashboardPath, roleConfig } from '@/constants/roles'
import { login, logout } from '@/features/auth/authSlice'
import { DEMO_PASSWORD, demoUsers } from '@/features/auth/mockAuthService'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/StatusBadge'
export function AppHeader() {
  const { user, loading, error } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  if (!user) return null
  return <header className="border-b bg-card px-6 py-4"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-medium capitalize">{user.name}</p><p className="text-xs text-muted-foreground">{roleConfig[user.role].label}</p></div><div className="flex flex-wrap items-center gap-3">{isDemoMode && <><StatusBadge variant="warning">Demo mode</StatusBadge><label className="sr-only" htmlFor="role-switch">Switch demo role</label><select id="role-switch" className="h-10 max-w-full rounded-md border bg-background px-2 text-sm" value={user.email} disabled={loading} onChange={async (event) => { const result = await dispatch(login({ email: event.target.value, password: DEMO_PASSWORD })); if (login.fulfilled.match(result)) navigate(dashboardPath(result.payload.user.role), { replace: true }) }}>{demoUsers.map((demo) => <option key={demo.id} value={demo.email}>{roleConfig[demo.role].label}</option>)}</select></>}<Button variant="outline" onClick={() => { dispatch(logout()); navigate('/login', { replace: true }) }}><LogOut aria-hidden="true" />Sign out</Button></div></div>{error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}</header>
}
