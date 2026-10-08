import axios from 'axios'
import type { ProblemDetails } from '@/types/api'

export class ApiError extends Error {
  readonly status?: number
  readonly validationErrors?: Record<string, string[]>
  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.validationErrors = errors
  }
}
export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError<ProblemDetails>(error)) {
    const problem = error.response?.data
    return new ApiError(problem?.detail || problem?.title || (error.response ? 'The request failed. Please try again.' : 'Unable to connect to the server.'), error.response?.status, problem?.errors)
  }
  return new ApiError(error instanceof Error ? error.message : 'An unexpected error occurred.')
}
