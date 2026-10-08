import type { DomainService } from '@/types/domain'
export interface CourseInput { title: string; description: string; sopVersionIds: string[]; quizPassingScore?: number }
export interface Course {
  id: string
  title: string
  description: string
  sopVersionIds: string[]
  quizPassingScore: number
  archived: boolean
}
export type CourseCommand =
  | { operation: 'create'; input: CourseInput }
  | { operation: 'update'; id: string; input: CourseInput }
  | { operation: 'archive'; id: string }
export type CourseService = DomainService<Course, CourseCommand>
