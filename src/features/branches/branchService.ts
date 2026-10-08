import { ApiError } from '@/services/apiError'
import { bindDomainService, useMockServices } from '@/services/domainService'
import { mockBranchService } from './mockBranchService'
import type { BranchService } from './branchTypes'
const binding = bindDomainService('Branches', mockBranchService)
let apiAdapter: BranchService | undefined
export const branchService: BranchService = {
  ...binding.service,
  async getSharedStandards(signal) {
    if (useMockServices) return mockBranchService.getSharedStandards(signal)
    if (!apiAdapter) throw new ApiError('Shared standards API adapter is not configured.', 501)
    return apiAdapter.getSharedStandards(signal)
  },
}
export function configureBranchService(adapter: BranchService) { apiAdapter = adapter; binding.configure(adapter) }
