import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { createDomainSelectors } from '@/utils/createDomainSlice'
export const courseSelectors = createDomainSelectors((state: RootState) => state.courses)
export const selectCoursesForSopVersion = createSelector(
  [courseSelectors.selectList, (_: RootState, versionId: string) => versionId],
  (courses, versionId) => courses.filter((course) => course.sopVersionIds.includes(versionId)),
)
