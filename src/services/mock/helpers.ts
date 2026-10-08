import { ApiError } from '@/services/apiError'
import type { Entity } from '@/types/domain'

export const copy = <T>(value: T): T => structuredClone(value)
export function requireRecord<T extends Entity>(records: Map<string, T>, id: string): T {
  const record = records.get(id)
  if (!record) throw new ApiError('Record not found.', 404)
  return record
}
export function requireText(value: string, field: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new ApiError(`${field} is required.`, 400, { [field]: ['Required.'] })
  return trimmed
}
export function checkSignal(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Request aborted.', 'AbortError')
}
export function mockRead<T extends Entity>(records: Map<string, T>) {
  return {
    async list(signal?: AbortSignal) { checkSignal(signal); return copy([...records.values()]) },
    async get(id: string, signal?: AbortSignal) { checkSignal(signal); return copy(requireRecord(records, id)) },
  }
}
