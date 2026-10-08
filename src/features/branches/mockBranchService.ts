import { ApiError } from '@/services/apiError'
import { checkSignal, copy, mockRead, requireRecord, requireText } from '@/services/mock/helpers'
import { mockBranches } from '@/services/mock/branchDirectory'
import { mockSharedStandards } from '@/services/mock/standards'
import type { Branch, BranchService } from './branchTypes'

export const mockBranchService: BranchService = {
  ...mockRead(mockBranches),
  async getSharedStandards(signal) { checkSignal(signal); return copy(mockSharedStandards) },
  async execute(command, signal) {
    checkSignal(signal)
    if (command.operation === 'setActive') {
      const branch = { ...requireRecord(mockBranches, command.id), active: command.active }
      mockBranches.set(branch.id, branch)
      return copy(branch)
    }
    const input = { name: requireText(command.input.name, 'name'), code: requireText(command.input.code, 'code').toUpperCase(), address: command.input.address }
    const existing = command.operation === 'update' ? requireRecord(mockBranches, command.id) : undefined
    if ([...mockBranches.values()].some((branch) => branch.code === input.code && branch.id !== existing?.id)) throw new ApiError('Branch code must be unique.', 409)
    const branch: Branch = { ...input, id: existing?.id ?? crypto.randomUUID(), active: existing?.active ?? true }
    mockBranches.set(branch.id, branch)
    return copy(branch)
  },
}
