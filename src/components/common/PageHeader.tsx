import type { ReactNode } from 'react'
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <header className="page-heading"><div><p className="eyebrow">BREWFORGE · SỔ TAY VẬN HÀNH</p><h1>{title}</h1>{description && <p className="page-purpose">{description}</p>}</div>{action && <div className="page-action">{action}</div>}</header>
}
