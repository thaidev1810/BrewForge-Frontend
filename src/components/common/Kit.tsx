import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { StatusBadge } from './StatusBadge'

export { fmtDate, today, addDays, useAction } from './kitHelpers'

/** Shared building blocks for all role pages: fields, tables, badges and feedback. */

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

const control = 'w-full rounded-lg border border-input bg-card px-3 text-sm shadow-[0_1px_0_rgba(60,30,15,.03)] transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 hover:border-foreground/30 focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-50'

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(control, 'h-10', className)} {...props} />
}

export function TextArea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-24 py-2.5 leading-relaxed', className)} {...props} />
}

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-10', className)} {...props} />
}

export function ErrorBox({ error }: { error: string | null | undefined }) {
  if (!error) return null
  return (
    <p role="alert" className="note note-error mb-4">
      {error}
    </p>
  )
}

export function SuccessBox({ message }: { message: string | null | undefined }) {
  if (!message) return null
  return (
    <p role="status" className="note note-success mb-4">
      {message}
    </p>
  )
}

export function Loading({ show, text = 'Loading…' }: { show: boolean; text?: string }) {
  return show ? (
    <p role="status" className="mb-4 inline-flex items-center gap-2.5 text-sm text-muted-foreground">
      <span className="spinner" />
      {text}
    </p>
  ) : null
}

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  empty = 'No records.',
  onRowClick,
  selectedKey,
}: {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  empty?: string
  onRowClick?: (row: T) => void
  selectedKey?: string | number | null
}) {
  if (rows.length === 0) {
    return <p className="rounded-lg border border-dashed border-input bg-accent/30 p-6 text-center text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <div className="bf-table-wrap">
      <table className="bf-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.header} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row)
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                data-selected={selectedKey === key}
                className={cn('align-top', onRowClick && 'cursor-pointer')}
              >
                {columns.map((col) => (
                  <td key={col.header} className={col.className}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function Pager({
  page,
  size,
  total,
  onPage,
}: {
  page: number
  size: number
  total: number
  onPage: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / size))
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-xs">
      <span className="text-muted-foreground tabular-nums">
        Page {page} of {pages} · {total} records
      </span>
      <button type="button" className="rounded-lg border border-input bg-card px-3 py-1.5 font-medium transition hover:bg-accent/60 disabled:opacity-40 disabled:hover:border-input disabled:hover:text-inherit" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ← Prev
      </button>
      <button type="button" className="rounded-lg border border-input bg-card px-3 py-1.5 font-medium transition hover:bg-accent/60 disabled:opacity-40 disabled:hover:border-input disabled:hover:text-inherit" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next →
      </button>
    </div>
  )
}

const stateVariants: Record<string, 'neutral' | 'success' | 'warning' | 'error'> = {
  ACTIVE: 'success',
  RELEASED: 'success',
  PUBLISHED: 'success',
  PASSED: 'success',
  VALID: 'success',
  LIVE: 'success',
  READY: 'success',
  COMPLETED: 'success',
  CLOSED: 'neutral',
  CERTIFIED: 'success',
  VALIDATED: 'warning',
  PENDING_APPROVAL: 'warning',
  RUNNING: 'warning',
  IN_PROGRESS: 'warning',
  ELIGIBLE: 'warning',
  PREPARING: 'warning',
  SCHEDULED: 'warning',
  NEEDS_RECERT: 'warning',
  NEEDS_REVIEW: 'warning',
  OPEN: 'warning',
  OUT_OF_DATE: 'warning',
  TRAINING: 'warning',
  DRAFT: 'neutral',
  FAILED: 'error',
  REJECTED: 'error',
  LOCKED: 'error',
  INACTIVE: 'error',
  DISCONTINUED: 'error',
  WITHDRAWN: 'error',
  CANCELLED: 'error',
  OVERDUE: 'error',
  SUPERSEDED: 'neutral',
  ARCHIVED: 'neutral',
}

export function StateBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return <StatusBadge variant={stateVariants[value] ?? 'neutral'}>{value}</StatusBadge>
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-end gap-3">{children}</div>
}

export function JsonView({ value }: { value: unknown }) {
  return <pre className="max-h-72 overflow-auto rounded-2xl border border-border bg-black/30 p-4 font-mono text-xs leading-relaxed text-[#f1dfd0]">{JSON.stringify(value, null, 2)}</pre>
}
