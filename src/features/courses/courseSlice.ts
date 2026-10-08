import { createDomainSlice } from '@/utils/createDomainSlice'
import { courseService } from './courseService'
const domain = createDomainSlice('courses', courseService)
export const fetchCourses = domain.fetchList
export const fetchCourse = domain.fetchDetail
export const mutateCourse = domain.mutate
export default domain.reducer
