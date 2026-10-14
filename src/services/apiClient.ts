import axios, { type InternalAxiosRequestConfig } from 'axios'
import { apiBaseUrl } from '@/constants/config'
import { normalizeApiError, ApiError } from './apiError'
let getAccessToken: () => string | null = () => null
let onUnauthorized: () => void = () => undefined
let refreshSession: (() => Promise<string>) | null = null
let getGeneration: () => number = () => 0
let refreshing: { generation: number; promise: Promise<string> } | null = null
export function configureApiAuth(getToken: () => string | null, unauthorized: () => void, refresh?: () => Promise<string>, generation?: () => number) {
  getAccessToken = getToken; onUnauthorized = unauthorized; refreshSession = refresh ?? null; getGeneration = generation ?? (() => 0)
}
export const authTransport = axios.create({ baseURL: apiBaseUrl, timeout: 20000, headers: { Accept: 'application/json' } })
export const apiClient = axios.create({ baseURL: apiBaseUrl, timeout: 30000, headers: { Accept: 'application/json' } })
type SessionRequest = InternalAxiosRequestConfig & { sessionGeneration?: number; retried?: boolean; usedToken?: string | null; retryAfterRefresh?: boolean }
apiClient.interceptors.request.use((config: SessionRequest) => {
  if (!config.baseURL) throw new ApiError('Chưa cấu hình VITE_API_BASE_URL.')
  if (config.sessionGeneration !== undefined && config.sessionGeneration !== getGeneration()) throw new ApiError('Phiên đăng nhập đã thay đổi.', 401)
  config.sessionGeneration ??= getGeneration()
  const token = getAccessToken(); config.usedToken = token
  if (token) config.headers.set('Authorization', `Bearer ${token}`); else config.headers.delete('Authorization')
  return config
})
apiClient.interceptors.response.use(response => {
  if ((response.config as SessionRequest).sessionGeneration !== getGeneration()) throw new ApiError('Phiên đăng nhập đã thay đổi.', 401)
  return response
}, async (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try { error.response.data = JSON.parse(await error.response.data.text()) } catch { /* Proxy may return HTML. */ }
  }
  const normalized = normalizeApiError(error)
  const config = axios.isAxiosError(error) ? error.config as SessionRequest | undefined : undefined
  if (normalized.status !== 401 || !config || /\/auth\/(login|refresh|logout)/.test(config.url ?? '')) throw normalized
  if (config.sessionGeneration !== getGeneration()) throw normalized
  if (config.retried || !refreshSession || !getAccessToken()) { onUnauthorized(); throw normalized }
  config.retried = true
  try {
    if (config.usedToken === getAccessToken()) {
      const generation = getGeneration()
      if (!refreshing || refreshing.generation !== generation) refreshing = { generation, promise: refreshSession().finally(() => { if (refreshing?.generation === generation) refreshing = null }) }
      await refreshing.promise
    }
    if (config.sessionGeneration !== getGeneration()) throw new ApiError('Phiên đăng nhập đã thay đổi.', 401)
  } catch (refreshError) { if (config.sessionGeneration === getGeneration()) onUnauthorized(); throw normalizeApiError(refreshError) }
  if (!['get', 'head', 'options'].includes((config.method ?? 'get').toLowerCase()) && !config.retryAfterRefresh) {
    throw new ApiError('Phiên đăng nhập đã được làm mới. Yêu cầu thay đổi chưa được gửi lại; hãy kiểm tra và xác nhận lại thao tác.', 401)
  }
  return apiClient.request(config)
})
