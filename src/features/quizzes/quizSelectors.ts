import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { createDomainSelectors } from '@/utils/createDomainSlice'
export const quizSelectors = createDomainSelectors((state: RootState) => state.quizzes)
export const selectQuizAttemptsForAssignment = createSelector(
  [quizSelectors.selectList, (_: RootState, assignmentId: string) => assignmentId],
  (attempts, assignmentId) => attempts.filter((attempt) => attempt.assignmentId === assignmentId),
)
// Advisory UI eligibility only; service/backend checks remain authoritative.
export const selectHasPassedQuiz = createSelector([selectQuizAttemptsForAssignment], (attempts) => attempts.some((attempt) => attempt.passed))
