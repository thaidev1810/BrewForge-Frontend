import { Link, NavLink } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { dashboardPath, roleConfig } from '@/constants/roles'

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]?.toUpperCase()).join('') || 'BF'

/** Desktop navigation: the role's tasks in a sticky bento panel. Below `lg` the header's pill tabs take over. */
export function AppSidebar() {
  const user = useAppSelector((state) => state.auth.user)
  if (!user) return null
  const config = roleConfig[user.role]
  return (
    <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 p-4 pr-0 lg:block">
      <div className="side-panel">
        <Link to={dashboardPath(user.role)} className="flex items-center gap-2.5 px-2" aria-label="BrewForge home">
          <img
            src="/brewforge-icon.png"
            alt="BrewForge Logo"
            className="size-10 shrink-0 rounded-[12px] border border-border/60 object-cover shadow-xs"
          />
          <span className="leading-tight">
            <span className="block text-[17px] font-semibold tracking-[-0.01em]">BrewForge</span>
            <span className="block text-[12px] text-muted-foreground">{config.label}</span>
          </span>
        </Link>

        <p className="mt-8 mb-2 px-3 text-[12px] font-medium text-muted-foreground">Workspace</p>
        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          {config.nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="side-pill">
              <Icon aria-hidden="true" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded-2xl border border-border bg-black/20 p-3">
          <span className="avatar">{initials(user.name)}</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13.5px] font-semibold">{user.name}</p>
            <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
              {user.username ? `@${user.username}` : config.label}
              {user.branchId ? ` · Branch #${user.branchId}` : ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
