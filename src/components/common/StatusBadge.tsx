import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
const styles = { neutral: 'badge-neutral', success: 'badge-success', warning: 'badge-warning', error: 'badge-error' }
export function StatusBadge({ children, variant = 'neutral' }: { children: ReactNode; variant?: keyof typeof styles }) {
  return <span className={cn('badge', styles[variant])}>{children}</span>
}
