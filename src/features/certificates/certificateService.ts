import { bindDomainService } from '@/services/domainService'
import { mockCertificateService } from './mockCertificateService'
const binding = bindDomainService('Certificates', mockCertificateService)
export const certificateService = binding.service
export const configureCertificateService = binding.configure
