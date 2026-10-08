import { ApiError } from '@/services/apiError'
import { checkSignal, copy, mockRead, requireRecord, requireText } from '@/services/mock/helpers'
import { mockPracticalAssessments } from '@/features/assessments/mockAssessmentService'
import { mockQuizAttempts } from '@/features/quizzes/mockQuizService'
import { mockSopVersions } from '@/features/sops/mockSopService'
import type { Certificate, CertificateService } from './certificateTypes'

export const mockCertificates = new Map<string, Certificate>()
export const mockCertificateService: CertificateService = {
  ...mockRead(mockCertificates),
  async execute(command, signal) {
    checkSignal(signal)
    if (command.operation === 'revoke') {
      const existing = requireRecord(mockCertificates, command.id)
      if (existing.revokedAt) throw new ApiError('Certificate is already revoked.', 409)
      const certificate = { ...existing, revokedAt: new Date().toISOString(), revocationReason: requireText(command.reason, 'reason') }
      mockCertificates.set(certificate.id, certificate)
      return copy(certificate)
    }
    const { assessmentId, sopVersionId } = command.input
    const assessment = requireRecord(mockPracticalAssessments, assessmentId)
    const attempt = requireRecord(mockQuizAttempts, assessment.quizAttemptId)
    if (!assessment.passed || assessment.criticalFailure || !attempt.passed) throw new ApiError('Certification requires passed quiz and practical assessments.', 409)
    if (!assessment.sopVersionIds.includes(sopVersionId) || !attempt.sopVersionIds.includes(sopVersionId)) throw new ApiError('Certificate must reference an exact SOP version covered by the assessments.', 409)
    if (!requireRecord(mockSopVersions, sopVersionId).publishedAt) throw new ApiError('Certificate SOP version must have been published.', 409)
    if ([...mockCertificates.values()].some((certificate) => certificate.traineeId === assessment.traineeId && certificate.sopVersionId === sopVersionId && !certificate.revokedAt)) throw new ApiError('An active certificate already exists for this trainee and SOP version.', 409)
    const certificate: Certificate = { id: crypto.randomUUID(), traineeId: assessment.traineeId, courseId: assessment.courseId, assessmentId, quizAttemptId: attempt.id, sopVersionId, issuedAt: new Date().toISOString(), revokedAt: null, revocationReason: null }
    mockCertificates.set(certificate.id, certificate)
    return copy(certificate)
  },
}
