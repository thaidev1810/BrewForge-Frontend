import type { AxiosRequestConfig } from 'axios'
import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { apiClient } from '@/services/apiClient'
import { normalizeApiError } from '@/services/apiError'
import type { EndpointContracts, Operation, RoleName } from './contracts'
import { endpoints } from './schema'
import { readTags, mutationTags } from './cachePolicy'
export type RecordData = Record<string, unknown>
export interface OperationCall { operation: Operation; params?: Record<string, string | number>; query?: Record<string, unknown>; body?: unknown; idempotencyKey?: string }
export interface ServerError { message: string; status?: number; code?: string; rule?: string | null; traceId?: string; validationErrors?: Record<string, string[]>; details?: { field: string; issue: string }[] }
export function canCall(operation: Operation, role: RoleName | undefined): boolean { return !!role && (endpoints[operation].roles as readonly string[]).includes(role) }
export function routeFor(call: OperationCall): string {
  const endpoint = endpoints[call.operation]
  return endpoint.path.replace(/^\/api\/v1/, '').replace(/\{(\*\*)?(\w+)(?::\w+)?\}/g, (_, catchAll: string | undefined, name: string) => {
    const value = call.params?.[name]
    if (value === undefined || value === '') throw new Error('Thiếu tham chiếu tài nguyên: ' + name)
    if (name === 'id' || name === 'moduleId' || name === 'courseId' || name === 'branchId' || name === 'entityId') {
      if (!Number.isSafeInteger(Number(value)) || Number(value) <= 0) throw new Error('Mã tham chiếu tài nguyên không hợp lệ.')
    }
    return catchAll ? String(value).split('/').map(encodeURIComponent).join('/') : encodeURIComponent(String(value))
  })
}
export async function executeOperation<K extends Operation>(operation: K, input: Omit<OperationCall, 'operation' | 'body'> & { body?: EndpointContracts[K]['request'] }, options?: AxiosRequestConfig): Promise<EndpointContracts[K]['response']>
export async function executeOperation(operation: Operation, input?: Omit<OperationCall, 'operation'>, options?: AxiosRequestConfig): Promise<unknown>
export async function executeOperation(operation: Operation, input: Omit<OperationCall, 'operation'> = {}, options: AxiosRequestConfig = {}): Promise<unknown> {
  const endpoint = endpoints[operation]
  const request: AxiosRequestConfig & { retryAfterRefresh: boolean } = {
    ...options, url: routeFor({ operation, ...input }), method: endpoint.method,
    params: input.query, data: input.body,
    responseType: endpoint.binary ? 'blob' : 'json',
    timeout: endpoint.upload ? 0 : /GenerateDraft|\.Repair$/.test(operation) ? 90000 : 30000,
    headers: { ...options.headers, ...(input.idempotencyKey ? { 'Idempotency-Key': input.idempotencyKey } : {}) },
    retryAfterRefresh: endpoint.idempotency && !!input.idempotencyKey,
  }
  const { data } = await apiClient.request(request)
  return data
}
const baseQuery: BaseQueryFn<OperationCall, unknown, ServerError> = async (arg, api) => {
  try { return { data: await executeOperation(arg.operation, arg, { signal: api.signal }) ?? null } }
  catch (error) { const e = normalizeApiError(error); return { error: { message: e.message, status: e.status, code: e.code, rule: e.rule, traceId: e.traceId, validationErrors: e.validationErrors, details: e.details } } }
}
export const backendApi = createApi({ reducerPath: 'backendApi', baseQuery, tagTypes: ['Workspace', 'Scope'], keepUnusedDataFor: 30, refetchOnFocus: true, refetchOnReconnect: true, refetchOnMountOrArgChange: true, endpoints: builder => ({
  read: builder.query<unknown, OperationCall>({ query: arg => arg, providesTags: (_data, _error, arg) => readTags(arg.operation) }),
  execute: builder.mutation<unknown, OperationCall>({ query: arg => arg, invalidatesTags: (_data, _error, arg) => mutationTags(arg.operation) }),
}) })
export const { useReadQuery, useExecuteMutation } = backendApi
export function asRecord(value: unknown): RecordData { return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordData : {} }
export function rowsOf(value: unknown): RecordData[] {
  if (Array.isArray(value)) return value.map(asRecord)
  const record = asRecord(value)
  for (const key of ['items', 'rows', 'groups', 'branches', 'entries', 'questions']) if (Array.isArray(record[key])) return (record[key] as unknown[]).map(asRecord)
  return []
}
