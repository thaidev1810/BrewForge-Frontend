import type { DomainService, RequestState } from '@/types/domain'
import type { SharedStandards } from '@/types/standards'
export interface BranchInput { name: string; code: string; address: string }
export interface Branch extends BranchInput { id: string; active: boolean }
export type BranchCommand =
  | { operation: 'create'; input: BranchInput }
  | { operation: 'update'; id: string; input: BranchInput }
  | { operation: 'setActive'; id: string; active: boolean }
export interface BranchService extends DomainService<Branch, BranchCommand> {
  getSharedStandards(signal?: AbortSignal): Promise<SharedStandards>
}
export interface SharedStandardsState { data: SharedStandards | null; request: RequestState }
