import { Coffee, LayoutDashboard } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { dashboardPath, roleConfig } from '@/constants/roles'
export function AppSidebar() {
  const user = useAppSelector((state) => state.auth.user)
  if (!user) return null
  return <aside className="border-b bg-espresso p-6 text-white md:min-h-screen md:w-64 md:shrink-0 md:border-b-0"><div className="flex items-center gap-3 text-xl font-bold"><Coffee className="text-caramel" aria-hidden="true" />BrewForge</div><p className="mt-2 text-sm text-white/70">Training & operating standards</p><nav aria-label="Main navigation" className="mt-8"><NavLink to={dashboardPath(user.role)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${isActive ? 'bg-white/15' : 'hover:bg-white/10'}`}><LayoutDashboard className="size-4" aria-hidden="true" />Dashboard</NavLink></nav><p className="mt-8 text-xs text-white/70">{roleConfig[user.role].label} workspace</p></aside>
}
