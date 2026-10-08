import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { createDomainSelectors } from '@/utils/createDomainSlice'
export const sopSelectors = createDomainSelectors((state: RootState) => state.sops)
export const selectPublishedSopVersions = createSelector([sopSelectors.selectList], (versions) => versions.filter((version) => version.status === 'PUBLISHED'))
export const selectVersionsForSop = createSelector(
  [sopSelectors.selectList, (_: RootState, sopId: string) => sopId],
  (versions, sopId) => versions.filter((version) => version.sopId === sopId).sort((a, b) => b.version - a.version),
)
