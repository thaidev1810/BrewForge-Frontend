import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { createDomainSelectors } from '@/utils/createDomainSlice'
export const certificateSelectors = createDomainSelectors((state: RootState) => state.certificates)
export const selectCertificatesForTrainee = createSelector(
  [certificateSelectors.selectList, (_: RootState, traineeId: string) => traineeId],
  (certificates, traineeId) => certificates.filter((certificate) => certificate.traineeId === traineeId),
)
export const selectCertificatesForSopVersion = createSelector(
  [certificateSelectors.selectList, (_: RootState, versionId: string) => versionId],
  (certificates, versionId) => certificates.filter((certificate) => certificate.sopVersionId === versionId),
)
