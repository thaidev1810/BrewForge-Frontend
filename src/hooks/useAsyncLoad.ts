import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError } from '@/services/apiError'

export function useAsyncLoad<T>(loader: () => Promise<T>, initialValue: T) {
  const [state, setState] = useState<{ data: T; loading: boolean; error: string | null }>({
    data: initialValue,
    loading: true,
    error: null,
  })
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    setTick((n) => n + 1)
  }, [])

  const setData = useCallback((updater: T | ((prev: T) => T)) => {
    setState((prev) => ({
      ...prev,
      data: typeof updater === 'function' ? (updater as (prev: T) => T)(prev.data) : updater,
    }))
  }, [])

  useEffect(() => {
    let active = true
    loader()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((err) => {
        if (active) setState((prev) => ({ ...prev, loading: false, error: normalizeApiError(err).message }))
      })
    return () => {
      active = false
    }
  }, [loader, tick])

  return { ...state, reload, setData }
}

