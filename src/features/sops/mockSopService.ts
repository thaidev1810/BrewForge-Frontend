import { ApiError } from '@/services/apiError'
import { checkSignal, copy, mockRead, requireRecord, requireText } from '@/services/mock/helpers'
import { mockSharedStandards } from '@/services/mock/standards'
import type { SopContent, SopService, SopStatus, SopVersion } from './sopTypes'

export const mockSopVersions = new Map<string, SopVersion>([
  ['sop-latte-v1', { id: 'sop-latte-v1', sopId: 'sop-latte', version: 1, title: 'Latte preparation', purpose: 'Consistent beverage preparation in every branch.', steps: ['Extract espresso.', 'Steam milk safely.', 'Pour and serve.'], equipmentIds: ['espresso-machine', 'milk-steamer'], status: 'PUBLISHED', publishedAt: '2026-01-01T00:00:00.000Z', reviewComment: null }],
])
function validateContent(content: SopContent): SopContent {
  if (!content.steps.length) throw new ApiError('At least one SOP step is required.', 400)
  const equipmentIds = [...new Set(content.equipmentIds)]
  if (equipmentIds.some((id) => !mockSharedStandards.equipment.some((item) => item.id === id))) throw new ApiError('Equipment must belong to the shared standards catalog.', 400)
  return { title: requireText(content.title, 'title'), purpose: requireText(content.purpose, 'purpose'), steps: content.steps.map((step) => requireText(step, 'steps')), equipmentIds }
}
function requireStatus(version: SopVersion, statuses: SopStatus[]) {
  if (!statuses.includes(version.status)) throw new ApiError(`Operation is not allowed for SOP status ${version.status}.`, 409)
}
export const mockSopService: SopService = {
  ...mockRead(mockSopVersions),
  async execute(command, signal) {
    checkSignal(signal)
    if (command.operation === 'create') {
      const version: SopVersion = { ...validateContent(command.input), id: crypto.randomUUID(), sopId: crypto.randomUUID(), version: 1, status: 'DRAFT', publishedAt: null, reviewComment: null }
      mockSopVersions.set(version.id, version)
      return copy(version)
    }
    const existing = requireRecord(mockSopVersions, command.id)
    if (command.operation === 'revise') {
      requireStatus(existing, ['PUBLISHED', 'DEPRECATED'])
      const versions = [...mockSopVersions.values()].filter((version) => version.sopId === existing.sopId)
      if (versions.some((version) => version.publishedAt === null)) throw new ApiError('A working version already exists for this SOP.', 409)
      const next: SopVersion = { ...copy(existing), id: crypto.randomUUID(), version: Math.max(...versions.map((version) => version.version)) + 1, status: 'DRAFT', publishedAt: null, reviewComment: null }
      mockSopVersions.set(next.id, next)
      return copy(next)
    }
    // Publication locks the content forever, including after deprecation.
    if (existing.publishedAt && command.operation !== 'deprecate') throw new ApiError('Published SOP versions are immutable. Create a new version.', 409)
    let updated = copy(existing)
    switch (command.operation) {
      case 'update':
        requireStatus(existing, ['DRAFT', 'CHANGES_REQUESTED'])
        updated = { ...updated, ...validateContent(command.input) }
        break
      case 'submitForReview': requireStatus(existing, ['DRAFT', 'CHANGES_REQUESTED']); updated.status = 'IN_REVIEW'; break
      case 'requestChanges': requireStatus(existing, ['IN_REVIEW']); updated.status = 'CHANGES_REQUESTED'; updated.reviewComment = requireText(command.comment, 'comment'); break
      case 'approve': requireStatus(existing, ['IN_REVIEW']); updated.status = 'APPROVED'; break
      case 'publish': requireStatus(existing, ['APPROVED']); updated.status = 'PUBLISHED'; updated.publishedAt = new Date().toISOString(); break
      case 'deprecate': requireStatus(existing, ['PUBLISHED']); updated.status = 'DEPRECATED'; break
    }
    mockSopVersions.set(updated.id, updated)
    return copy(updated)
  },
}
