import type { RootState } from '@/app/store'
import { createDomainSelectors } from '@/utils/createDomainSlice'
export const branchSelectors = createDomainSelectors((state: RootState) => state.branches)
export const selectSharedStandards = (state: RootState) => state.branches.sharedStandards.data
export const selectSharedStandardsRequest = (state: RootState) => state.branches.sharedStandards.request
