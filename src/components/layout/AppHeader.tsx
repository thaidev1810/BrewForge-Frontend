import { LogOut, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { roleConfig } from '@/constants/roles'
import { signOut } from '@/features/auth/authSlice'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/features/notifications/NotificationBell'
export function AppHeader() {
  const user = useAppSelector(s => s.auth.user), dispatch = useAppDispatch(), navigate = useNavigate(), [busy, setBusy] = useState(false)
  if (!user) return null
  async function exit() { setBusy(true); const task = dispatch(signOut()); navigate('/login', { replace: true }); await task }
  return <header className="workspace-header"><div><p className="eyebrow">BREWFORGE WORKSPACE</p><p className="text-sm muted">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date())}</p></div><div className="flex items-center gap-3"><NotificationBell /><Link className="user-chip" to={roleConfig[user.role].prefix + '/account'}><span className="avatar"><UserRound size={19} /></span><span><strong>{user.name}</strong><small>{roleConfig[user.role].label}</small></span></Link><Button variant="outline" disabled={busy} onClick={() => void exit()}><LogOut size={16} /><span className="hidden sm:inline">{busy ? 'Đang thoát…' : 'Đăng xuất'}</span></Button></div></header>
}
