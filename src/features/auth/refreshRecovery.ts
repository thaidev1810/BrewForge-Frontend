// A lost refresh response cannot be recovered: BE has no replay endpoint for rotated pairs.
// Store only a flag in this tab; retain the pair until explicit logout/login.
const key = 'brewforge.refresh-uncertain.v1'
let uncertain = false
export function refreshUncertain(): boolean {
  try { return uncertain || sessionStorage.getItem(key) === '1' } catch { return uncertain }
}
export function markRefreshUncertain() { uncertain = true; try { sessionStorage.setItem(key, '1') } catch { /* Memory fallback. */ } }
export function clearRefreshUncertain() { uncertain = false; try { sessionStorage.removeItem(key) } catch { /* Storage unavailable. */ } }
