import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
const styles = { neutral: 'bg-muted text-muted-foreground', success: 'bg-green-100 text-green-800', warning: 'bg-amber-100 text-amber-900', error: 'bg-red-100 text-red-800' }
export function StatusBadge({ children, variant = 'neutral' }: { children: ReactNode; variant?: keyof typeof styles }) {
  return <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-medium', styles[variant])}>{children}</span>
}
