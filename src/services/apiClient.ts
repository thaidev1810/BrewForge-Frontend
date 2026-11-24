import axios, { type InternalAxiosRequestConfig } from 'axios'
import { normalizeApiError, ApiError } from './apiError'

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

// Inject callbacks at app startup to avoid a circular dependency on the Redux store.
let getAccessToken: () => string | null = () => null
let onUnauthorized: () => void = () => undefined
let tryRefreshToken: (() => Promise<string | null>) | null = null
let refreshInFlight: Promise<string | null> | null = null

export function configureApiAuth(
  getToken: () => string | null,
  unauthorized: () => void,
  refreshAccessToken?: () => Promise<string | null>,
) {
  getAccessToken = getToken
  onUnauthorized = unauthorized
  tryRefreshToken = refreshAccessToken ?? null
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || undefined,
  timeout: 30000,
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  if (!config.baseURL) throw new ApiError('Set VITE_API_BASE_URL before using the backend API.')
  const token = getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const normalized = normalizeApiError(error)
    if (normalized.status === 401 && axios.isAxiosError(error) && error.config) {
      const config = error.config as RetryableConfig
      const url = config.url ?? ''
      const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')
      if (!isAuthCall && !config._retried && tryRefreshToken) {
        config._retried = true
        refreshInFlight ??= tryRefreshToken().finally(() => {
          refreshInFlight = null
        })
        const refreshed = await refreshInFlight
        if (refreshed) {
          config.headers.set('Authorization', `Bearer ${refreshed}`)
          return apiClient.request(config)
        }
      }
      if (!isAuthCall) onUnauthorized()
    } else if (normalized.status === 401) {
      onUnauthorized()
    }
    return Promise.reject(normalized)
  },
)
