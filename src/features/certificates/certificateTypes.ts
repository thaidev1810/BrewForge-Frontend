import type { DomainService } from '@/types/domain'
export interface Certificate {
  id: string
  traineeId: string
  courseId: string
  assessmentId: string
  quizAttemptId: string
  sopVersionId: string
  issuedAt: string
  revokedAt: string | null
  revocationReason: string | null
}
export interface CertificateIssueInput { assessmentId: string; sopVersionId: string }
export type CertificateCommand =
  | { operation: 'issue'; input: CertificateIssueInput }
  | { operation: 'revoke'; id: string; reason: string }
export type CertificateService = DomainService<Certificate, CertificateCommand>
