import { createAsyncThunk, createSelector, createSlice, type Draft } from '@reduxjs/toolkit'
import { login, logout } from '@/features/auth/authSlice'
import { normalizeApiError } from '@/services/apiError'
import type { DomainError, DomainService, DomainState, Entity, MutationCommand, RequestState } from '@/types/domain'

export const mutationKey = (command: MutationCommand) => command.id ?? '$create'
const idle = (): RequestState => ({ status: 'idle', error: null })
const rejectError = (error: unknown): DomainError => {
  const normalized = normalizeApiError(error)
  return { message: normalized.message, status: normalized.status, validationErrors: normalized.validationErrors }
}

export function createDomainSlice<T extends Entity, C extends MutationCommand>(name: string, service: DomainService<T, C>) {
  const initial = (): DomainState<T> => ({ entities: {}, listIds: [], list: idle(), details: {}, mutations: {}, revision: 0, sequence: 0, entitySequences: {}, listInvalidated: true })
  // Immer cannot resolve a generic entity's conditional Draft type at compile time.
  const upsert = (state: Draft<DomainState<T>>, entity: T, sequence: number) => {
    if ((state.entitySequences[entity.id] ?? -1) > sequence) return
    (state.entities as Record<string, Draft<T>>)[entity.id] = entity as Draft<T>
    state.entitySequences[entity.id] = sequence
  }
  const fetchList = createAsyncThunk<T[], void, { rejectValue: DomainError }>(`${name}/fetchList`, async (_, api) => {
    try { return await service.list(api.signal) }
    catch (error) { return api.rejectWithValue(rejectError(error)) }
  })
  const fetchDetail = createAsyncThunk<T, string, { rejectValue: DomainError }>(`${name}/fetchDetail`, async (id, api) => {
    try { return await service.get(id, api.signal) }
    catch (error) { return api.rejectWithValue(rejectError(error)) }
  })
  const mutate = createAsyncThunk<T, C, { rejectValue: DomainError }>(`${name}/mutate`, async (command, api) => {
    try { return await service.execute(command, api.signal) }
    catch (error) { return api.rejectWithValue(rejectError(error)) }
  }, {
    // Serialize writes to one entity; callers can inspect meta.condition for a skipped write.
    condition: (command, api) => {
      const state = (api.getState() as Record<string, DomainState<T>>)[name]
      return state?.mutations[mutationKey(command)]?.status !== 'loading'
    },
  })
  const slice = createSlice({
    name, initialState: initial(), reducers: {},
    extraReducers: (builder) => {
      builder.addCase(logout, initial)
        .addCase(login.fulfilled, initial)
        .addCase(fetchList.pending, (state, action) => {
          state.sequence += 1
          state.list = { status: 'loading', error: null, requestId: action.meta.requestId, revision: state.revision, sequence: state.sequence }
        })
        .addCase(fetchList.fulfilled, (state, action) => {
          if (state.list.requestId !== action.meta.requestId) return
          if (state.list.revision !== state.revision) { state.list = idle(); state.listInvalidated = true; return }
          for (const entity of action.payload) upsert(state, entity, state.list.sequence ?? 0)
          state.listIds = action.payload.map((entity) => entity.id)
          state.list = { status: 'succeeded', error: null }
          state.listInvalidated = false
        })
        .addCase(fetchList.rejected, (state, action) => {
          if (state.list.requestId !== action.meta.requestId) return
          state.list = action.meta.aborted ? idle() : { status: 'failed', error: action.payload ?? { message: action.error.message ?? 'Unable to load records.' } }
        })
        .addCase(fetchDetail.pending, (state, action) => {
          state.sequence += 1
          state.details[action.meta.arg] = { status: 'loading', error: null, requestId: action.meta.requestId, revision: state.revision, sequence: state.sequence }
        })
        .addCase(fetchDetail.fulfilled, (state, action) => {
          const request = state.details[action.meta.arg]
          if (request?.requestId !== action.meta.requestId) return
          if (request.revision !== state.revision) { state.details[action.meta.arg] = idle(); return }
          upsert(state, action.payload, request.sequence ?? 0)
          state.details[action.meta.arg] = { status: 'succeeded', error: null }
        })
        .addCase(fetchDetail.rejected, (state, action) => {
          if (state.details[action.meta.arg]?.requestId !== action.meta.requestId) return
          state.details[action.meta.arg] = action.meta.aborted ? idle() : { status: 'failed', error: action.payload ?? { message: action.error.message ?? 'Unable to load record.' } }
        })
        .addCase(mutate.pending, (state, action) => {
          state.mutations[mutationKey(action.meta.arg)] = { status: 'loading', error: null, requestId: action.meta.requestId }
        })
        .addCase(mutate.fulfilled, (state, action) => {
          const key = mutationKey(action.meta.arg)
          if (state.mutations[key]?.requestId !== action.meta.requestId) return
          state.sequence += 1
          upsert(state, action.payload, state.sequence)
          state.revision += 1
          state.listInvalidated = true
          state.mutations[key] = { status: 'succeeded', error: null }
          // Mutations update the entity cache; re-fetch the list to determine membership/order.
          for (const id of Object.keys(state.details)) {
            if (state.details[id].status !== 'loading') state.details[id] = idle()
          }
        })
        .addCase(mutate.rejected, (state, action) => {
          const key = mutationKey(action.meta.arg)
          if (state.mutations[key]?.requestId !== action.meta.requestId) return
          state.mutations[key] = action.meta.aborted ? idle() : { status: 'failed', error: action.payload ?? { message: action.error.message ?? 'Unable to save record.' } }
        })
    },
  })
  return { reducer: slice.reducer, fetchList, fetchDetail, mutate }
}

export function createDomainSelectors<Root, T extends Entity>(selectState: (root: Root) => DomainState<T>) {
  const selectEntities = (root: Root) => selectState(root).entities
  const selectListIds = (root: Root) => selectState(root).listIds
  const defaultRequest = idle()
  return {
    selectState,
    selectList: createSelector([selectEntities, selectListIds], (entities, ids) => ids.map((id) => entities[id]).filter((item): item is T => !!item)),
    selectById: (root: Root, id: string) => selectEntities(root)[id],
    selectListRequest: (root: Root) => selectState(root).list,
    selectDetailRequest: (root: Root, id: string) => selectState(root).details[id] ?? defaultRequest,
    selectMutationRequest: (root: Root, id = '$create') => selectState(root).mutations[id] ?? defaultRequest,
    selectListInvalidated: (root: Root) => selectState(root).listInvalidated,
  }
}
