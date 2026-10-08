import { createDomainSlice } from '@/utils/createDomainSlice'
import { quizService } from './quizService'
const domain = createDomainSlice('quizzes', quizService)
export const fetchQuizAttempts = domain.fetchList
export const fetchQuizAttempt = domain.fetchDetail
export const recordQuizAttempt = domain.mutate
export default domain.reducer
