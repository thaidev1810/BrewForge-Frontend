import axios from 'axios'
import type { BackendErrorPayload } from '@/types/api'

export class ApiError extends Error {
  readonly status?: number
  readonly validationErrors?: Record<string, string[]>
  readonly code?: string
  readonly rule?: string | null
  readonly traceId?: string

  constructor(
    message: string,
    status?: number,
    errors?: Record<string, string[]>,
    meta?: { code?: string; rule?: string | null; traceId?: string },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.validationErrors = errors
    this.code = meta?.code
    this.rule = meta?.rule
    this.traceId = meta?.traceId
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError<BackendErrorPayload>(error)) {
    const payload = error.response?.data
    let validationErrors: Record<string, string[]> | undefined = payload?.errors
    if (!validationErrors && Array.isArray(payload?.details) && payload.details.length > 0) {
      validationErrors = {}
      for (const item of payload.details) {
        const key = item.field || '_form'
        validationErrors[key] = [...(validationErrors[key] ?? []), item.issue]
      }
    }
    const detailSummary =
      Array.isArray(payload?.details) && payload.details.length > 0
        ? ` (${payload.details.map((d) => `${d.field}: ${d.issue}`).join('; ')})`
        : ''
    const rulePrefix = payload?.rule ? `[${payload.rule}] ` : ''
    const baseMessage =
      payload?.message ||
      payload?.detail ||
      payload?.title ||
      (error.response ? 'The request failed. Please try again.' : 'Unable to connect to the server.')
    const fullMessage = payload?.message ? `${rulePrefix}${baseMessage}${detailSummary}` : baseMessage
    return new ApiError(fullMessage, error.response?.status, validationErrors, {
      code: payload?.code,
      rule: payload?.rule,
      traceId: payload?.traceId,
    })
  }
  return new ApiError(error instanceof Error ? error.message : 'An unexpected error occurred.')
}
