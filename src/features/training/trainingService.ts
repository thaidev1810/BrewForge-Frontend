import { bindDomainService } from '@/services/domainService'
import { mockTrainingService } from './mockTrainingService'
const binding = bindDomainService('Training assignments', mockTrainingService)
export const trainingService = binding.service
export const configureTrainingService = binding.configure
