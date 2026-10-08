import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { createDomainSelectors } from '@/utils/createDomainSlice'
export const assessmentSelectors = createDomainSelectors((state: RootState) => state.assessments)
export const selectAssessmentsForAssignment = createSelector(
  [assessmentSelectors.selectList, (_: RootState, assignmentId: string) => assignmentId],
  (assessments, assignmentId) => assessments.filter((assessment) => assessment.assignmentId === assignmentId),
)
