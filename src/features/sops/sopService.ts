import { bindDomainService } from '@/services/domainService'
import { mockSopService } from './mockSopService'
const binding = bindDomainService('SOPs', mockSopService)
export const sopService = binding.service
export const configureSopService = binding.configure
