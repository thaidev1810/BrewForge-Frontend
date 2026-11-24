import { useEffect, useRef, useState } from 'react'
import { Bell, LogOut, Shield, X } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { isDemoMode } from '@/constants/config'
import { dashboardPath, roleConfig } from '@/constants/roles'
import { login, signOut } from '@/features/auth/authSlice'
import { authService } from '@/features/auth/authService'
import { DEV_SEED_PASSWORD, seededDevAccounts, type MeProfile } from '@/features/auth/authTypes'
import { DEMO_PASSWORD, demoUsers } from '@/features/auth/mockAuthService'
import { brewforgeApi } from '@/services/brewforgeApi'
import { normalizeApiError } from '@/services/apiError'
import type { MyNotificationDto, PushConfigDto, PushSubscriptionDto } from '@/types/backend'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/common/StatusBadge'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replaceAll('-', '+').replaceAll('_', '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]?.toUpperCase()).join('') || 'BF'

export function AppHeader() {
  const { user, loading, error } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [navOverflowing, setNavOverflowing] = useState(false)

  // Keep the open page's tab in view and fade the edge when more tabs sit off-screen.
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const update = () => setNavOverflowing(nav.scrollWidth - nav.scrollLeft - nav.clientWidth > 4)
    nav.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    update()
    nav.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      nav.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [pathname, user?.role])

  const [openPanel, setOpenPanel] = useState<'notifications' | 'profile' | null>(null)
  const [notifications, setNotifications] = useState<MyNotificationDto[]>([])
  const [notifTotal, setNotifTotal] = useState(0)
  const [pushConfig, setPushConfig] = useState<PushConfigDto | null>(null)
  const [pushSubs, setPushSubs] = useState<PushSubscriptionDto[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifMessage, setNotifMessage] = useState<string | null>(null)

  const [meProfile, setMeProfile] = useState<MeProfile | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwMessage, setPwMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [pwBusy, setPwBusy] = useState(false)

  if (!user) return null
  const config = roleConfig[user.role]

  const loadNotifications = async () => {
    if (isDemoMode) {
      setNotifications([])
      setNotifTotal(0)
      return
    }
    setNotifLoading(true)
    setNotifMessage(null)
    try {
      const [paged, cfg, subs] = await Promise.all([
        brewforgeApi.notifications.myNotifications({ page: 1, size: 20 }),
        brewforgeApi.notifications.getPushConfig(),
        brewforgeApi.notifications.listPushSubscriptions(),
      ])
      setNotifications(paged.items)
      setNotifTotal(paged.total)
      setPushConfig(cfg)
      setPushSubs(subs)
    } catch (err) {
      setNotifMessage(normalizeApiError(err).message)
    } finally {
      setNotifLoading(false)
    }
  }

  const toggleNotifications = () => {
    if (openPanel === 'notifications') {
      setOpenPanel(null)
      return
    }
    setOpenPanel('notifications')
    void loadNotifications()
  }

  const toggleProfile = async () => {
    if (openPanel === 'profile') {
      setOpenPanel(null)
      return
    }
    setOpenPanel('profile')
    setPwMessage(null)
    if (authService.me) {
      try {
        setMeProfile(await authService.me())
      } catch (err) {
        setPwMessage({ kind: 'err', text: normalizeApiError(err).message })
      }
    }
  }

  const handleSubscribeBrowserPush = async () => {
    if (!pushConfig?.enabled || !pushConfig.publicKey) {
      setNotifMessage('Server Web Push VAPID public key is not configured.')
      return
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setNotifMessage('Web Push is not supported in this browser.')
      return
    }
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pushConfig.publicKey),
      })
      const json = sub.toJSON()
      await brewforgeApi.notifications.subscribePush(
        sub.endpoint,
        json.keys?.p256dh ?? '',
        json.keys?.auth ?? '',
      )
      await loadNotifications()
      setNotifMessage('Subscribed to Web Push notifications.')
    } catch (err) {
      setNotifMessage(normalizeApiError(err).message)
    }
  }

  const handleRemoveSub = async (endpoint: string) => {
    try {
      await brewforgeApi.notifications.unsubscribePush(endpoint)
      await loadNotifications()
    } catch (err) {
      setNotifMessage(normalizeApiError(err).message)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authService.changePassword) return
    setPwBusy(true)
    setPwMessage(null)
    try {
      await authService.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setPwMessage({ kind: 'ok', text: 'Password updated successfully.' })
    } catch (err) {
      setPwMessage({ kind: 'err', text: normalizeApiError(err).message })
    } finally {
      setPwBusy(false)
    }
  }

  return (
    <header className="topbar">
      <div className="mx-auto max-w-[1440px] px-4 py-3 lg:px-6">
      <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
        <Link to={dashboardPath(user.role)} className="flex shrink-0 items-center gap-2.5 lg:hidden" aria-label="BrewForge home">
          <img
            src="/brewforge-icon.png"
            alt="BrewForge Logo"
            className="size-9 shrink-0 rounded-[10px] border border-border/60 object-cover"
          />
          <span className="hidden text-[17px] font-semibold tracking-[-0.01em] sm:inline">BrewForge</span>
        </Link>

        <nav ref={navRef} aria-label="Main navigation" className={`pillnav order-last w-full lg:hidden${navOverflowing ? ' is-overflowing' : ''}`}>
          {config.nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="pill">
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <p className="hidden min-w-0 truncate text-sm text-muted-foreground lg:block">
          {config.nav.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))?.label ?? config.label}
        </p>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {isDemoMode ? (
            <>
              <span className="hidden 2xl:inline-flex"><StatusBadge variant="warning">Mock mode</StatusBadge></span>
              <label className="sr-only" htmlFor="role-switch">
                Switch demo role
              </label>
              <select
                id="role-switch"
                className="hidden h-10 max-w-[200px] rounded-full border border-border bg-card px-4 text-xs outline-none 2xl:block"
                value={user.email}
                disabled={loading}
                onChange={async (event) => {
                  const result = await dispatch(login({ email: event.target.value, password: DEMO_PASSWORD }))
                  if (login.fulfilled.match(result)) {
                    setOpenPanel(null)
                    navigate(dashboardPath(result.payload.user.role), { replace: true })
                  }
                }}
              >
                {demoUsers.map((demo) => (
                  <option key={demo.id} value={demo.email}>
                    {roleConfig[demo.role].label}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label className="sr-only" htmlFor="seed-account-switch">
                Quick switch seeded account
              </label>
              <select
                id="seed-account-switch"
                className="hidden h-10 max-w-[200px] rounded-full border border-border bg-card px-4 text-xs outline-none 2xl:block"
                value={seededDevAccounts.some((a) => a.username === user.username) ? user.username : ''}
                disabled={loading}
                onChange={async (event) => {
                  if (!event.target.value) return
                  const result = await dispatch(
                    login({ username: event.target.value, password: DEV_SEED_PASSWORD }),
                  )
                  if (login.fulfilled.match(result)) {
                    setOpenPanel(null)
                    navigate(dashboardPath(result.payload.user.role), { replace: true })
                  }
                }}
              >
                <option value="" disabled>
                  Switch account…
                </option>
                {seededDevAccounts.map((acc) => (
                  <option key={acc.username} value={acc.username}>
                    {acc.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <button type="button" className="icon-btn relative" onClick={toggleNotifications} aria-label={`Notifications${notifTotal > 0 ? ` (${notifTotal})` : ''}`} aria-expanded={openPanel === 'notifications'}>
            <Bell className="size-[17px]" aria-hidden="true" />
            {notifTotal > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--butter)]" aria-hidden="true" />}
          </button>

          <button type="button" className="user-chip" onClick={() => void toggleProfile()} aria-label="Account" aria-expanded={openPanel === 'profile'}>
            <span className="avatar">{initials(user.name)}</span>
            <span className="hidden min-w-0 text-left leading-tight md:block">
              <span className="block max-w-[150px] truncate text-[13.5px] font-semibold">{user.name}</span>
              <span className="block max-w-[150px] truncate text-[11.5px] text-muted-foreground">{config.label}{user.branchId ? ` · Branch #${user.branchId}` : ''}</span>
            </span>
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-label="Sign out"
            onClick={() => {
              void dispatch(signOut()).finally(() => navigate('/login', { replace: true }))
            }}
          >
            <LogOut className="size-[17px]" aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {openPanel === 'notifications' && (
        <div className="surface mt-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">My Notifications & Web Push</h2>
            <div className="flex items-center gap-2">
              {!isDemoMode && (
                <Button size="sm" variant="outline" type="button" onClick={() => void loadNotifications()}>
                  Refresh
                </Button>
              )}
              <Button size="sm" variant="ghost" type="button" onClick={() => setOpenPanel(null)}>
                <X aria-hidden="true" />
              </Button>
            </div>
          </div>

          {notifMessage && <p className="mb-3 text-xs text-muted-foreground">{notifMessage}</p>}

          {!isDemoMode && pushConfig && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3 text-xs">
              <div>
                <span className="font-medium">Web Push:</span>{' '}
                {pushConfig.enabled ? 'Enabled on server' : 'Disabled on server'} · Active subscriptions:{' '}
                {pushSubs.length}
              </div>
              <div className="flex flex-wrap gap-2">
                {pushConfig.enabled && (
                  <Button size="sm" variant="outline" type="button" onClick={() => void handleSubscribeBrowserPush()}>
                    Subscribe browser
                  </Button>
                )}
                {pushSubs.map((sub) => (
                  <Button
                    key={sub.id}
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => void handleRemoveSub(sub.endpoint)}
                  >
                    Unsubscribe #{sub.id}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {notifLoading ? (
            <p className="text-xs text-muted-foreground">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="max-h-60 space-y-2 overflow-y-auto text-sm">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{n.subject}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()} · Email: {n.emailStatus} · Push: {n.pushStatus}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {openPanel === 'profile' && (
        <div className="surface mt-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="size-4" aria-hidden="true" />
              Account Profile, Permissions & Password
            </h2>
            <Button size="sm" variant="ghost" type="button" onClick={() => setOpenPanel(null)}>
              <X aria-hidden="true" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-3 text-xs">
              <p className="font-semibold">Current Session (/auth/me)</p>
              <p className="mt-1">
                Username: <strong>{meProfile?.username ?? user.username}</strong> · Email:{' '}
                <strong>{meProfile?.email ?? user.email}</strong>
              </p>
              <p className="mt-1">
                Role: <strong>{meProfile?.role ?? user.role}</strong> · Branch ID:{' '}
                <strong>{meProfile?.branchId ?? user.branchId ?? 'Head Office (All)'}</strong>
              </p>
              {meProfile?.permissions && meProfile.permissions.length > 0 && (
                <div className="mt-2">
                  <p className="mb-1 font-medium">Granted Permissions ({meProfile.permissions.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {meProfile.permissions.map((perm) => (
                      <span key={perm} className="rounded bg-muted px-2 py-0.5 text-[11px]">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form className="space-y-2 rounded-lg border p-3 text-xs" onSubmit={(e) => void handlePasswordChange(e)}>
              <p className="font-semibold">Change Password (/auth/change-password)</p>
              <div>
                <label className="mb-1 block font-medium" htmlFor="hdr-cur-pw">
                  Current password
                </label>
                <Input
                  id="hdr-cur-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block font-medium" htmlFor="hdr-new-pw">
                  New password (min 8 chars)
                </label>
                <Input
                  id="hdr-new-pw"
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              {pwMessage && (
                <p className={pwMessage.kind === 'ok' ? 'text-green-700' : 'text-destructive'}>{pwMessage.text}</p>
              )}
              <Button size="sm" type="submit" disabled={pwBusy}>
                {pwBusy ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </div>
        </div>
      )}
      </div>
    </header>
  )
}
