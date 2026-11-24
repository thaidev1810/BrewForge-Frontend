import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchAttendanceRecords } from '@/features/attendance/attendanceSlice'
import { fetchPracticalAssessments } from '@/features/assessments/assessmentSlice'
import { fetchCertificates } from '@/features/certificates/certificateSlice'
import { fetchCourses } from '@/features/courses/courseSlice'
import { fetchQuizAttempts } from '@/features/quizzes/quizSlice'
import { fetchSopVersions } from '@/features/sops/sopSlice'
import { fetchTrainingAssignments } from '@/features/training/trainingSlice'
import { attendanceSelectors } from '@/features/attendance/attendanceSelectors'
import { assessmentSelectors } from '@/features/assessments/assessmentSelectors'
import { certificateSelectors } from '@/features/certificates/certificateSelectors'
import { courseSelectors } from '@/features/courses/courseSelectors'
import { quizSelectors } from '@/features/quizzes/quizSelectors'
import { sopSelectors } from '@/features/sops/sopSelectors'
import { trainingSelectors } from '@/features/training/trainingSelectors'

// Loads every list the training screens read, and hands back what they need. `reload` refreshes after a write.
export function useTrainingData() {
  const dispatch = useAppDispatch()
  const reload = useCallback(() => {
    dispatch(fetchCourses())
    dispatch(fetchSopVersions())
    dispatch(fetchTrainingAssignments())
    dispatch(fetchAttendanceRecords())
    dispatch(fetchQuizAttempts())
    dispatch(fetchPracticalAssessments())
    dispatch(fetchCertificates())
  }, [dispatch])
  useEffect(reload, [reload])

  const courses = useAppSelector(courseSelectors.selectList)
  const sops = useAppSelector(sopSelectors.selectList)
  const assignments = useAppSelector(trainingSelectors.selectList)
  const attendance = useAppSelector(attendanceSelectors.selectList)
  const quizzes = useAppSelector(quizSelectors.selectList)
  const assessments = useAppSelector(assessmentSelectors.selectList)
  const certificates = useAppSelector(certificateSelectors.selectList)
  const requests = [useAppSelector(courseSelectors.selectListRequest), useAppSelector(trainingSelectors.selectListRequest), useAppSelector(quizSelectors.selectListRequest), useAppSelector(assessmentSelectors.selectListRequest), useAppSelector(certificateSelectors.selectListRequest), useAppSelector(attendanceSelectors.selectListRequest)]
  const loading = requests.some((request) => request.status === 'loading') && assignments.length === 0
  const error = requests.find((request) => request.status === 'failed')?.error ?? null
  return { courses, sops, assignments, attendance, quizzes, assessments, certificates, facts: { quizzes, assessments, certificates }, loading, error, reload }
}
