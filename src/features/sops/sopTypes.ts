import type { DomainService } from '@/types/domain'
export const SOP_STATUSES = ['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'DEPRECATED'] as const
export type SopStatus = typeof SOP_STATUSES[number]
export interface SopContent { title: string; purpose: string; steps: string[]; equipmentIds: string[] }
export interface SopVersion extends SopContent {
  id: string
  sopId: string
  version: number
  status: SopStatus
  publishedAt: string | null
  reviewComment: string | null
}
export type SopCommand =
  | { operation: 'create'; input: SopContent }
  | { operation: 'update'; id: string; input: SopContent }
  | { operation: 'submitForReview' | 'approve' | 'publish' | 'deprecate' | 'revise'; id: string }
  | { operation: 'requestChanges'; id: string; comment: string }
export type SopService = DomainService<SopVersion, SopCommand>
