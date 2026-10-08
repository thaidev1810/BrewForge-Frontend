import { createAsyncThunk, createReducer, type UnknownAction } from '@reduxjs/toolkit'
import { login, logout } from '@/features/auth/authSlice'
import { normalizeApiError } from '@/services/apiError'
import { createDomainSlice } from '@/utils/createDomainSlice'
import type { DomainError, DomainState } from '@/types/domain'
import type { SharedStandards } from '@/types/standards'
import type { Branch, SharedStandardsState } from './branchTypes'
import { branchService } from './branchService'

const domain = createDomainSlice('branches', branchService)
export const fetchBranches = domain.fetchList
export const fetchBranch = domain.fetchDetail
export const mutateBranch = domain.mutate
export const fetchSharedStandards = createAsyncThunk<SharedStandards, void, { rejectValue: DomainError }>('branches/fetchSharedStandards', async (_, api) => {
  try { return await branchService.getSharedStandards(api.signal) }
  catch (error) {
    const normalized = normalizeApiError(error)
    return api.rejectWithValue({ message: normalized.message, status: normalized.status, validationErrors: normalized.validationErrors })
  }
})
const initialStandards = (): SharedStandardsState => ({ data: null, request: { status: 'idle', error: null } })
const standardsReducer = createReducer(initialStandards(), (builder) => {
  builder.addCase(logout, initialStandards)
    .addCase(login.fulfilled, initialStandards)
    .addCase(fetchSharedStandards.pending, (state, action) => { state.request = { status: 'loading', error: null, requestId: action.meta.requestId } })
    .addCase(fetchSharedStandards.fulfilled, (state, action) => {
      if (state.request.requestId !== action.meta.requestId) return
      state.data = action.payload
      state.request = { status: 'succeeded', error: null }
    })
    .addCase(fetchSharedStandards.rejected, (state, action) => {
      if (state.request.requestId !== action.meta.requestId) return
      state.request = action.meta.aborted ? { status: 'idle', error: null } : { status: 'failed', error: action.payload ?? { message: action.error.message ?? 'Unable to load standards.' } }
    })
})
export interface BranchState extends DomainState<Branch> { sharedStandards: SharedStandardsState }
// Both concerns live under one registered branches reducer; standards are stored once.
export default function branchesReducer(state: BranchState | undefined, action: UnknownAction): BranchState {
  const records = domain.reducer(state, action)
  const sharedStandards = standardsReducer(state?.sharedStandards, action)
  if (state && records === state && sharedStandards === state.sharedStandards) return state
  return { ...records, sharedStandards }
}
