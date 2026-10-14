import axios from 'axios'
import type { ErrorEnvelope } from './backend/contracts'
export class ApiError extends Error {
  readonly status?: number
  readonly validationErrors?: Record<string, string[]>
  readonly code?: string
  readonly rule?: string | null
  readonly traceId?: string
  constructor(message: string, status?: number, errors?: Record<string, string[]>, envelope?: Partial<ErrorEnvelope>) {
    super(message); this.name = 'ApiError'; this.status = status; this.validationErrors = errors
    this.code = envelope?.code; this.rule = envelope?.rule; this.traceId = envelope?.traceId
  }
}
export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError(error)) {
    const raw: unknown = error.response?.data
    const data = raw && typeof raw === 'object' ? raw as Partial<ErrorEnvelope> & { detail?: string; title?: string; errors?: Record<string, string[]> } : {}
    const fields = data.errors ?? {}
    if (Array.isArray(data.details)) for (const detail of data.details) (fields[detail.field] ??= []).push(detail.issue)
    return new ApiError(data.message || data.detail || data.title || (error.response ? 'Yêu cầu không thực hiện được.' : 'Không kết nối được máy chủ. Kiểm tra kết nối và địa chỉ API.'), error.response?.status, fields, data)
  }
  return new ApiError(error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong đợi.')
}
