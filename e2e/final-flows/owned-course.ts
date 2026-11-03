import type { Page } from '@playwright/test'
import { api, entity, save, type Manifest } from './harness.js'

export async function authoredCourse(trainer: Page, m: Manifest, key: string) {
  let id = m.ids[key]
  if (!id) {
    const created = await api(trainer, 'Courses.Create', {}, { title: m.runId + ' ' + key, courseType: 'INDUCTION', recipeVersionId: null })
    if (!created.ok) throw new Error('Owned test course creation rejected')
    id = Number(created.data.id); m.ids[key] = id; entity(m, 'course', id, 'DRAFT ' + key); save(m)
  }
  const course = await api(trainer, 'Courses.Get', { id })
  if (!course.ok || course.data.title !== m.runId + ' ' + key) throw new Error('Owned test course mismatch')
  if (course.data.state !== 'DRAFT') return id
  const questions = await api(trainer, 'Courses.ListQuestions', { id })
  for (const module of course.data.modules as { id: number; durationMinutes: number | null; lessons: { id: number }[] }[]) {
    if (!module.durationMinutes) { const duration = await api(trainer, 'CourseModules.Update', { id: module.id }, { durationMinutes: 1 }); if (!duration.ok) throw new Error('Module duration rejected') }
    if (!module.lessons.length) { const lesson = await api(trainer, 'CourseModules.AddLesson', { id: module.id }, { title: m.runId + ' technical exercise', content: 'BrewForge automated technical test. Clean the work surface. Mix the measured ingredient evenly by hand.' }); if (!lesson.ok) throw new Error('Test lesson rejected') }
    if (!(questions.data as unknown as { courseModuleId: number }[]).some(question => question.courseModuleId === module.id)) {
      const question = await api(trainer, 'Courses.AddQuestion', { id }, { courseModuleId: module.id, questionText: 'For this technical exercise, what should be cleaned?', options: [{ key: 'A', text: 'The work surface' }, { key: 'B', text: 'Nothing' }], correctOption: 'A' })
      if (!question.ok) throw new Error('Test quiz question rejected')
    }
  }
  return id
}
export async function readEveryLesson(learner: Page, enrollmentId: number) {
  const progress = await api(learner, 'Enrollments.Modules', { id: enrollmentId })
  for (const row of progress.data as unknown as { module: { lessons: { id: number }[] }; readLessonIds: number[] }[]) for (const lesson of row.module.lessons) {
    if (row.readLessonIds?.includes(lesson.id)) continue
    const read = await api(learner, 'Enrollments.CompleteLesson', { id: enrollmentId, lessonId: lesson.id })
    if (!read.ok) throw new Error('Lesson prerequisite rejected')
  }
}
