import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/utils/cn'

const pct = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

export function ProgressBar({ value, label, className }: { value: number; label: string; className?: string }) {
  const v = pct(value)
  return (
    <div
      className={cn('progress', v >= 100 && 'is-done', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
    >
      <span style={{ width: `${v}%` }} />
    </div>
  )
}

export function ScoreRing({
  value,
  size = 96,
  stroke = 8,
  tone = 'ink',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  tone?: 'ink' | 'success' | 'error'
  children: ReactNode
}) {
  const color = tone === 'success' ? 'var(--mint)' : tone === 'error' ? 'var(--coral)' : 'var(--latte)'
  const style = { '--p': pct(value), '--c': color, '--w': `${stroke}px`, width: size, height: size } as CSSProperties
  return (
    <div className="ring shrink-0" style={style}>
      <div className="text-center leading-none">{children}</div>
    </div>
  )
}
