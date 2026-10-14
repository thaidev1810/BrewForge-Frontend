import { Coffee, Menu, X, LayoutGrid, ChevronRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { roleConfig } from '@/constants/roles'
import { navigationFor } from '@/constants/navigation'
export function AppSidebar() {
  const user = useAppSelector(s => s.auth.user), [open, setOpen] = useState(false)
  if (!user) return null
  const entries = navigationFor(user.role), groups = [...new Set(entries.map(e => e.group))]
  return <aside className="workspace-sidebar"><div className="sidebar-brand"><div className="brand"><Coffee size={26} />BrewForge<span className="brand-dot" /></div><button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Đóng menu' : 'Mở menu'} aria-expanded={open}>{open ? <X /> : <Menu />}</button></div><p className="sidebar-tagline">Standards in every cup.</p><nav className={open ? 'sidebar-nav open' : 'sidebar-nav'} aria-label="Điều hướng chính">{groups.map(group => <section key={group}><h2>{group}</h2>{entries.filter(e => e.group === group).map(entry => <NavLink key={entry.key} to={`${roleConfig[user.role].prefix}/${entry.key}`} onClick={() => setOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><LayoutGrid size={15} /><span>{entry.title}</span><ChevronRight size={13} /></NavLink>)}</section>)}</nav><div className="sidebar-footer"><span className="live-dot" />{roleConfig[user.role].label}<p>Craft better. Learn together.</p></div></aside>
}
