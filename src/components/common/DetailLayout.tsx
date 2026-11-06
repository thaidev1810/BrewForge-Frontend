import { useId, useRef, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Panels remain mounted: changing sections cannot discard a local draft.
export function DetailTabs({ tabs, param = 'section' }: { tabs: { key: string; title: string; content: ReactNode }[]; param?: string }) {
  const location = useLocation(), navigate = useNavigate(), search = new URLSearchParams(location.search), id = useId(), list = useRef<HTMLDivElement>(null)
  const active = tabs.some(t => t.key === search.get(param)) ? search.get(param)! : tabs[0]?.key
  function select(key: string) { const next = new URLSearchParams(search); next.set(param, key); void navigate({ pathname: location.pathname, search: '?' + next.toString(), hash: location.hash }, { replace: true, preventScrollReset: true, state: location.state }) }
  return <><div className="detail-tabs" role="tablist" aria-label="Các phần nội dung" ref={list}>{tabs.map((tab, index) => <button key={tab.key} type="button" role="tab" id={`${id}-${tab.key}`} aria-controls={`${id}-${tab.key}-panel`} aria-selected={active === tab.key} tabIndex={active === tab.key ? 0 : -1} onClick={() => select(tab.key)} onKeyDown={event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    select(tabs[next].key); list.current?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus()
  }}>{tab.title}</button>)}</div>{tabs.map(tab => <div key={tab.key} id={`${id}-${tab.key}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab.key}`} hidden={active !== tab.key} tabIndex={0}>{tab.content}</div>)}</>
}

export function Fold({ title, children, open = false, id, className = '' }: { title: ReactNode; children: ReactNode; open?: boolean; id?: string; className?: string }) {
  return <details className={'detail-fold '+className} open={open || undefined} id={id}><summary>{title}</summary><div className="fold-body">{children}</div></details>
}

export function ReadMore({ text }: { text: string }) {
  return text.length < 280 ? <span className="whitespace-pre-wrap">{text}</span> : <details className="read-more"><summary><span className="line-clamp-2">{text.slice(0, 240)}…</span><span className="text-link">Xem thêm / Thu gọn</span></summary><p className="whitespace-pre-wrap">{text}</p></details>
}
