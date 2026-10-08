import { createDomainSlice } from '@/utils/createDomainSlice'
import { assessmentService } from './assessmentService'
const domain = createDomainSlice('assessments', assessmentService)
export const fetchPracticalAssessments = domain.fetchList
export const fetchPracticalAssessment = domain.fetchDetail
export const recordPracticalAssessment = domain.mutate
export default domain.reducer
