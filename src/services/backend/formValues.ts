import { schemas } from './schema'
import { asRecord, type RecordData } from './operations'
export type SchemaField = { name: string; type: string }
export function fieldsFor(schema: string): readonly SchemaField[] { return schemas[schema as keyof typeof schemas] ?? [] }
export function formDefaults(schema: string): RecordData {
  const result: RecordData = {}
  fieldsFor(schema).forEach(f => { result[f.name] = f.type.startsWith('IReadOnlyList') ? [] : null })
  if (schema === 'CreateRecipeRequest') result.origin = 'NEW'
  if (schema === 'CreateCourseRequest') result.courseType = 'PRODUCT'
  if (schema === 'SessionRequest') result.moduleIds = []
  if (schema === 'PilotRequest') result.minCertifiedStaff = 2
  if (schema === 'TrainingRegulationRequest') Object.assign(result, { dueDays: 14, maxRetakes: 2, minAttendancePct: 80 })
  if (schema === 'QuizRequest') result.passScore = 80
  return result
}
export function requestFields(schema: string, value: unknown): RecordData {
  const source = asRecord(value), result = formDefaults(schema)
  fieldsFor(schema).forEach(f => {
    const v = source[f.name]
    if (v === undefined) return
    const list = f.type.replace(/\?$/, '').match(/^IReadOnlyList<(.+)>$/)
    if (list && Array.isArray(v)) result[f.name] = list[1] in schemas ? v.map(item => requestFields(list[1], item)) : v
    else if (f.type.replace(/\?$/, '') in schemas && v !== null) result[f.name] = requestFields(f.type.replace(/\?$/, ''), v)
    else result[f.name] = v
  })
  if (schema === 'RecipeContentRequest') {
    result.steps = Array.isArray(source.steps) ? source.steps.map(item => {
      const step = requestFields('StepRequest', item)
      step.dependsOn = Array.isArray(asRecord(item).dependsOn) ? (asRecord(item).dependsOn as unknown[]).map(d => ({ stepOrder: asRecord(d).stepOrder, stepId: null, type: asRecord(d).type })) : []
      return step
    }) : []
  }
  return result
}
