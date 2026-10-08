import { bindDomainService } from '@/services/domainService'
import { mockCourseService } from './mockCourseService'
const binding = bindDomainService('Courses', mockCourseService)
export const courseService = binding.service
export const configureCourseService = binding.configure
