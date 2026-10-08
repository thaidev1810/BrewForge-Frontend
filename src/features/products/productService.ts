import { bindDomainService } from '@/services/domainService'
import { mockProductService } from './mockProductService'
const binding = bindDomainService('Products', mockProductService)
export const productService = binding.service
export const configureProductService = binding.configure
