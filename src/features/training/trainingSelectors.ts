import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { createDomainSelectors } from '@/utils/createDomainSlice'
export const trainingSelectors = createDomainSelectors((state: RootState) => state.training)
export const selectAssignmentsForTrainee = createSelector(
  [trainingSelectors.selectList, (_: RootState, traineeId: string) => traineeId],
  (assignments, traineeId) => assignments.filter((assignment) => assignment.traineeId === traineeId),
)
