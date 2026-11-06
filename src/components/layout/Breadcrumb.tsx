import { Link, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { roleConfig } from '@/constants/roles'
import { navigationEntryFor } from '@/constants/navigation'
export function Breadcrumb() {
 const user=useAppSelector(s=>s.auth.user),location=useLocation()
 if(!user)return null
 const prefix=roleConfig[user.role].prefix,entry=navigationEntryFor(user.role,location.pathname,prefix)
 const detail=entry&&location.pathname!==prefix+'/'+entry.key
 return <nav className="breadcrumb" aria-label="Vị trí hiện tại"><Link to={prefix+'/dashboard'}>BrewForge</Link><span aria-hidden="true">/</span>{entry?<>{detail?<Link to={prefix+'/'+entry.key}>{entry.title}</Link>:<span aria-current="page">{entry.title}</span>}{detail&&<><span aria-hidden="true">/</span><span aria-current="page">Chi tiết</span></>}</>:<span aria-current="page">Chi tiết</span>}</nav>
}
