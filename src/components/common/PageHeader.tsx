import type { ReactNode } from 'react'
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div className="min-w-0 max-w-3xl">
        <h1 className="text-[clamp(24px,2.4vw,30px)] font-bold leading-tight tracking-[-0.02em] text-balance">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground text-pretty">{description}</p>}
      </div>
      {action}
    </div>
  )
}
