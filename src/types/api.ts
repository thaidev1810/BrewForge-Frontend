// Compatible with both BrewForge Backend ErrorEnvelope and ASP.NET Core ProblemDetails.
export interface ErrorDetail {
  field: string
  issue: string
}

export interface ErrorEnvelope {
  code?: string
  message?: string
  rule?: string | null
  details?: ErrorDetail[]
  traceId?: string
}

export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  traceId?: string
  errors?: Record<string, string[]>
}

export type BackendErrorPayload = ErrorEnvelope & ProblemDetails
