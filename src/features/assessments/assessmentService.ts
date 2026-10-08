import { bindDomainService } from '@/services/domainService'
import { mockAssessmentService } from './mockAssessmentService'
const binding = bindDomainService('Practical assessments', mockAssessmentService)
export const assessmentService = binding.service
export const configureAssessmentService = binding.configure
