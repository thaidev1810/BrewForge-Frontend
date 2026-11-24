import { Navigate, Link, useRouteError } from 'react-router-dom'
import { lazy } from 'react'
import type React from 'react'
import { useAppSelector } from '@/app/hooks'
import { dashboardPath } from '@/constants/roles'

export const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((module) => ({ default: module.LoginPage })))

export function HomeRedirect() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  return <Navigate to={isAuthenticated && user ? dashboardPath(user.role) : '/login'} replace />
}

function Notice({ code, title, subtitle, children }: { code: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="app-shell grid min-h-screen place-items-center p-6">
      <div className="max-w-lg text-center">
        <p className="font-display text-[clamp(88px,18vw,170px)] font-black leading-none tracking-[-0.05em] text-foreground/90">{code}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
      </div>
    </main>
  )
}

const linkCls = 'inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-brand cursor-pointer'

export function NotFound() {
  return (
    <Notice code="404" title="This page went cold.">
      <Link to="/" className={linkCls}>Back to your workspace</Link>
    </Notice>
  )
}

export function RouteError() {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : null

  return (
    <Notice
      code="Oops"
      title="Unable to open this page."
      subtitle={message ? `A new update may have been deployed (${message}). Click below to refresh.` : 'Please refresh your browser to load the latest workspace version.'}
    >
      <button
        type="button"
        onClick={() => window.location.reload()}
        className={linkCls}
      >
        Reload your workspace
      </button>
    </Notice>
  )
}
