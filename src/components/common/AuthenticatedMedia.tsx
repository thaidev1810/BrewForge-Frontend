import { useEffect, useState } from 'react'
import { brewforgeApi } from '@/services/brewforgeApi'
import { normalizeApiError } from '@/services/apiError'

export function AuthenticatedVideo({ videoId, className }: { videoId: number; className?: string }) {
  const [state, setState] = useState<{ url: string | null; error: string | null }>({ url: null, error: null })

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    brewforgeApi.enrollments
      .fetchPracticalVideoBlob(videoId)
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setState({ url: objectUrl, error: null })
      })
      .catch((err) => {
        if (active) setState({ url: null, error: normalizeApiError(err).message })
      })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [videoId])

  if (state.error) return <p className="text-xs text-destructive">Unable to load video: {state.error}</p>
  if (!state.url) return <p className="text-xs text-muted-foreground">Loading video stream…</p>
  return <video controls src={state.url} className={className ?? 'mt-2 max-h-72 w-full rounded-lg border bg-black'} />
}

export function AuthenticatedEvidenceImage({
  evidenceUrl,
  alt = 'Audit evidence',
  className,
}: {
  evidenceUrl: string
  alt?: string
  className?: string
}) {
  const [state, setState] = useState<{ url: string | null; error: string | null }>({ url: null, error: null })

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    brewforgeApi.quality
      .fetchEvidenceBlob(evidenceUrl)
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setState({ url: objectUrl, error: null })
      })
      .catch((err) => {
        if (active) setState({ url: null, error: normalizeApiError(err).message })
      })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [evidenceUrl])

  if (state.error) return <span className="text-xs text-destructive">Evidence error: {state.error}</span>
  if (!state.url) return <span className="text-xs text-muted-foreground">Loading photo…</span>
  return (
    <a href={state.url} target="_blank" rel="noreferrer" className="inline-block">
      <img src={state.url} alt={alt} className={className ?? 'h-20 w-20 rounded border object-cover'} />
    </a>
  )
}

