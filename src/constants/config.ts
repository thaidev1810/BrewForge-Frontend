export const isDemoMode = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_AUTH !== 'false')
