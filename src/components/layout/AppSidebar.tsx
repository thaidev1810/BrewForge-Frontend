import { Coffee, Menu, X, LayoutGrid, ChevronDown, PanelLeftClose, PanelLeftOpen, BookOpen, FlaskConical, ShieldCheck, BarChart3, Settings, Store, UserRound, Bell, GraduationCap } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { roleConfig } from '@/constants/roles'
import { navigationFor, navigationEntryFor } from '@/constants/navigation'
function read(key: string) { try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null } }
function save(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Optional preferences. */ } }
export function AppSidebar() {
  const user = useAppSelector(s => s.auth.user)
  return user ? <Sidebar key={user.role} role={user.role} name={user.name} /> : null
}
function Sidebar({ role, name }: { role: keyof typeof roleConfig; name: string }) {
  const [open,setOpen] = useState(false), [collapsed,setCollapsed] = useState(() => read('brewforge.sidebar.'+role) === true)
  const [closed,setClosed] = useState<string[]>(() => { const value = read('brewforge.groups.'+role); return Array.isArray(value) ? value.filter(v => typeof v === 'string') : [] })
  const location = useLocation(), aside = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement>(null)
  const entries = navigationFor(role), groups = [...new Set(entries.map(e => e.group))], prefix = roleConfig[role].prefix
  const current = navigationEntryFor(role, location.pathname, prefix)
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'
    aside.current?.querySelector<HTMLButtonElement>('.drawer-close')?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); trigger.current?.focus() }
      if(e.key === 'Tab') { const nodes=[...(aside.current?.querySelectorAll<HTMLElement>('button,a[href]')??[])].filter(n=>n.getClientRects().length); const first=nodes[0],last=nodes.at(-1); if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()} }
    }
    document.addEventListener('keydown',handler)
    return () => { document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',handler) }
  },[open])
  const icons: Record<string, typeof Coffee> = { 'Tổng quan': LayoutGrid, 'Công thức & sản phẩm': FlaskConical, 'Đào tạo': GraduationCap, 'Vận hành chi nhánh': Store, 'Chất lượng': ShieldCheck, 'Báo cáo': BarChart3, 'Quản trị hệ thống': Settings, 'Cá nhân': UserRound }
  return <><div className="mobile-sidebar-bar"><span className="brand"><Coffee size={22}/>BrewForge</span><button ref={trigger} aria-label="Mở menu" aria-expanded={open} aria-controls="workspace-navigation" onClick={()=>setOpen(true)}><Menu/></button></div>{open&&<button className="sidebar-backdrop" aria-label="Đóng menu" onClick={()=>{setOpen(false);trigger.current?.focus()}}/>}<aside ref={aside} role={open?'dialog':undefined} aria-modal={open||undefined} className={`workspace-sidebar ${collapsed?'is-collapsed':''} ${open?'drawer-open':''}`} aria-label="Không gian làm việc"><div className="sidebar-brand"><span className="brand"><Coffee size={25}/><span className="brand-name">BrewForge</span></span><button className="desktop-collapse" aria-label={collapsed?'Mở rộng sidebar':'Thu gọn sidebar'} title={collapsed?'Mở rộng sidebar':'Thu gọn sidebar'} onClick={()=>{setCollapsed(!collapsed);save('brewforge.sidebar.'+role,!collapsed)}}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button><button className="drawer-close" aria-label="Đóng menu" onClick={()=>{setOpen(false);trigger.current?.focus()}}><X/></button></div><p className="sidebar-tagline">Standards in every cup.</p><nav id="workspace-navigation" className="sidebar-nav" aria-label="Điều hướng chính">{groups.map((group,index)=>{const Icon=icons[group]??BookOpen, expanded=!closed.includes(group)||current?.group===group||collapsed;return <section key={group}><button className="nav-group" aria-expanded={expanded} aria-controls={'nav-group-'+index} onClick={()=>{const next=closed.includes(group)?closed.filter(g=>g!==group):[...closed,group];setClosed(next);save('brewforge.groups.'+role,next)}}><span>{group}</span><ChevronDown size={13}/></button><div id={'nav-group-'+index} hidden={!expanded}>{entries.filter(e=>e.group===group).map(entry=><Link key={entry.key} to={prefix+'/'+entry.key} title={collapsed?entry.title:undefined} aria-label={entry.title} aria-current={current?.key===entry.key?'page':undefined} onClick={()=>{setOpen(false);trigger.current?.focus()}} className={`nav-item ${current?.key===entry.key?'active':''}`}>{entry.key==='notifications'?<Bell size={17}/>:<Icon size={17}/>}<span>{entry.title}</span></Link>)}</div></section>})}</nav><div className="sidebar-footer"><Link to={prefix+'/account'} title={name} onClick={()=>setOpen(false)}><UserRound size={18}/><span><strong>{name}</strong><small>{roleConfig[role].label}</small></span></Link></div></aside></>
}
