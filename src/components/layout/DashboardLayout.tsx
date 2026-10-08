import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
export function DashboardLayout() {
  return <div className="min-h-screen md:flex"><a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-card focus:p-4">Skip to content</a><AppSidebar /><div className="min-w-0 flex-1"><AppHeader /><main id="main-content" className="mx-auto max-w-7xl p-6 lg:p-10"><Outlet /></main></div></div>
}
