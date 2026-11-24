import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
export function DashboardLayout() {
  const { pathname } = useLocation()
  // A new page starts at its top, not at the scroll position of the previous one.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="app-shell lg:flex">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-full focus:bg-card focus:px-5 focus:py-3">Skip to content</a>
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <AppHeader />
        <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-8 lg:px-6 lg:py-8">
          <div key={pathname} className="page-in"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}
