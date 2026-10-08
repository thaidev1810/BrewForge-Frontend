import axios from 'axios'
import { normalizeApiError, ApiError } from './apiError'

// Inject callbacks at app startup to avoid a circular dependency on the Redux store.
let getAccessToken: () => string | null = () => null
let onUnauthorized: () => void = () => undefined
export function configureApiAuth(getToken: () => string | null, unauthorized: () => void) {
  getAccessToken = getToken
  onUnauthorized = unauthorized
}
export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || undefined, timeout: 15000, headers: { Accept: 'application/json' } })
apiClient.interceptors.request.use((config) => {
  if (!config.baseURL) throw new ApiError('Set VITE_API_BASE_URL before using the backend API.')
  const token = getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})
apiClient.interceptors.response.use((response) => response, (error: unknown) => {
  const normalized = normalizeApiError(error)
  if (normalized.status === 401) onUnauthorized()
  return Promise.reject(normalized)
})
