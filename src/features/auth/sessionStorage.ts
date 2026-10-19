export interface TokenPair { accessToken: string; refreshToken: string }
export const SESSION_STORAGE_KEY = 'brewforge.session.v1'
export function clearStoredSession(): void {
  try { globalThis.sessionStorage?.removeItem(SESSION_STORAGE_KEY) } catch { /* Storage may be blocked. */ }
}
export function readStoredSession(): TokenPair | null {
  try {
    const raw = globalThis.sessionStorage?.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (value && typeof value === 'object' && 'version' in value && value.version === 1 && 'accessToken' in value && typeof value.accessToken === 'string' && value.accessToken.trim() && 'refreshToken' in value && typeof value.refreshToken === 'string' && value.refreshToken.trim()) return { accessToken: value.accessToken, refreshToken: value.refreshToken }
  } catch { /* Invalid JSON or inaccessible storage is not an authenticated session. */ }
  clearStoredSession()
  return null
}
export function writeStoredSession(tokens: TokenPair | null): void {
  if (!tokens) { clearStoredSession(); return }
  try { globalThis.sessionStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify({ version: 1, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })) } catch { /* Keep the current in-memory session usable. */ }
}
