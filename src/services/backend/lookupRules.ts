import type { RecordData } from './operations'
export function clearDependentPeople(value: RecordData, field: string, next: unknown): RecordData {
  const result = { ...value, [field]: next }
  if (field === 'branchId' && value[field] !== next) {
    for (const name of ['employeeIds', 'traineeIds']) if (name in result) result[name] = []
    for (const name of ['userId', 'trainerId']) if (name in result) result[name] = null
  }
  if (field === 'courseId' && value[field] !== next && 'trainerId' in result) result.trainerId = null
  return result
}
export function mergePeopleSelection(selected: string[], visible: number[], chosen: number[]): number[] {
  return [...new Set([...selected.filter(id => !visible.includes(Number(id))).map(Number), ...chosen])]
}
