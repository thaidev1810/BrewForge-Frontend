import { useState } from 'react'
import { normalizeApiError } from '@/services/apiError'

export function fmtDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export const today = () => new Date().toISOString().slice(0, 10)

export const addDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)

/** Runs a write action with busy/error/success state, and calls `after` on success. */
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const run = async <R,>(work: () => Promise<R>, success?: string | ((result: R) => string), after?: (result: R) => void) => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const result = await work()
      if (success) setMessage(typeof success === 'function' ? success(result) : success)
      after?.(result)
      return result
    } catch (err) {
      setError(normalizeApiError(err).message)
      return undefined
    } finally {
      setBusy(false)
    }
  }

  return { busy, error, message, run, setError, setMessage }
}

