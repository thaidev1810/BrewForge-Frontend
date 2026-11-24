import type { ReactNode } from 'react'
import type { DomainError } from '@/types/domain'
export function Panel({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="surface mb-6 p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-input bg-accent/30 p-8 text-center text-sm text-muted-foreground">{children}</p>
}
export function LoadState({ loading, error }: { loading: boolean; error: DomainError | null }) {
  if (error) return <p role="alert" className="note note-error mb-6">{error.message}</p>
  if (loading) return <p role="status" className="mb-6 inline-flex items-center gap-2.5 text-sm text-muted-foreground"><span className="spinner" />Loading…</p>
  return null
}
export function FormMessage({ error }: { error: string | null }) {
  return error ? <p role="alert" className="note note-error mt-3">{error}</p> : null
}
