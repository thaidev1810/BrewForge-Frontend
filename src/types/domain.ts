export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed'
export interface DomainError {
  message: string
  status?: number
  validationErrors?: Record<string, string[]>
}
export interface RequestState {
  status: RequestStatus
  error: DomainError | null
  requestId?: string
  revision?: number
  sequence?: number
}
export interface Entity { id: string }
export interface MutationCommand { operation: string; id?: string }
export interface DomainState<T extends Entity> {
  entities: Record<string, T>
  listIds: string[]
  list: RequestState
  details: Record<string, RequestState>
  mutations: Record<string, RequestState>
  revision: number
  sequence: number
  entitySequences: Record<string, number>
  listInvalidated: boolean
}
export interface DomainService<T extends Entity, Command extends MutationCommand> {
  list(signal?: AbortSignal): Promise<T[]>
  get(id: string, signal?: AbortSignal): Promise<T>
  execute(command: Command, signal?: AbortSignal): Promise<T>
}
