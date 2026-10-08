import { ApiError } from './apiError'
import type { DomainService, Entity, MutationCommand } from '@/types/domain'

export const useMockServices = import.meta.env.VITE_ENABLE_MOCK_SERVICES === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_SERVICES !== 'false')

// Register approved .NET adapters here via each domain's configure*Service export.
// There are deliberately no assumed HTTP routes or automatic mock fallbacks in API mode.
export function bindDomainService<T extends Entity, C extends MutationCommand>(name: string, mock: DomainService<T, C>) {
  let api: DomainService<T, C> | undefined
  const resolve = () => {
    if (useMockServices) return mock
    if (!api) throw new ApiError(`${name} API adapter is not configured.`, 501)
    return api
  }
  return {
    service: {
      list: async (signal?: AbortSignal) => resolve().list(signal),
      get: async (id: string, signal?: AbortSignal) => resolve().get(id, signal),
      execute: async (command: C, signal?: AbortSignal) => resolve().execute(command, signal),
    } satisfies DomainService<T, C>,
    configure: (adapter: DomainService<T, C>) => { api = adapter },
  }
}
