import { bindDomainService } from '@/services/domainService'
import { mockQuizService } from './mockQuizService'
const binding = bindDomainService('Quiz attempts', mockQuizService)
export const quizService = binding.service
export const configureQuizService = binding.configure
