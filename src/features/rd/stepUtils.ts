import type { DependencyType, StepDto, StepRequest } from '@/types/backend'

export interface StepRow {
  actionText: string
  equipmentClass: string
  techniqueGate: string
  durationSeconds: string
  ingredients: string // "ING01 18 g, ING02 30 ml"
  dependsOn: string // "1, 2:REQUIRES_OUTPUT"
}

export const emptyRow = (): StepRow => ({
  actionText: '',
  equipmentClass: '',
  techniqueGate: '',
  durationSeconds: '',
  ingredients: '',
  dependsOn: '',
})

export function stepsToRows(steps: StepDto[]): StepRow[] {
  return [...steps]
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map((s) => ({
      actionText: s.actionText,
      equipmentClass: s.equipmentClass ?? '',
      techniqueGate: s.techniqueGate ?? '',
      durationSeconds: s.durationSeconds != null ? String(s.durationSeconds) : '',
      ingredients: s.ingredients.map((i) => `${i.ingredientCode ?? i.ingredientId} ${i.quantity} ${i.unit}`).join(', '),
      dependsOn: s.dependsOn.map((d) => (d.type === 'FINISH_TO_START' ? String(d.stepOrder) : `${d.stepOrder}:${d.type}`)).join(', '),
    }))
}

export function rowsToSteps(rows: StepRow[]): StepRequest[] {
  return rows.map((row, index) => ({
    stepOrder: index + 1,
    actionText: row.actionText.trim(),
    equipmentClass: row.equipmentClass.trim() || null,
    techniqueGate: row.techniqueGate.trim() || null,
    durationSeconds: row.durationSeconds.trim() ? Number(row.durationSeconds) : null,
    ingredients: row.ingredients
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [code, qty, unit] = part.split(/\s+/)
        return /^\d+$/.test(code) && !unit
          ? { ingredientId: Number(code), quantity: Number(qty), unit: '' }
          : { ingredientCode: code, quantity: Number(qty), unit: unit ?? '' }
      }),
    dependsOn: row.dependsOn
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [order, type] = part.split(':')
        return { stepOrder: Number(order), type: (type?.trim() as DependencyType) || 'FINISH_TO_START' }
      }),
  }))
}

