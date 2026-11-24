import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn'
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input data-slot="input" className={cn('flex h-10 w-full rounded-lg border border-input bg-card px-3.5 text-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 hover:border-foreground/30 focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground/10 disabled:opacity-50 aria-invalid:border-destructive', className)} {...props} />
}
