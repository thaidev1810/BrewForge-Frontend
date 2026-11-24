import type { ModuleType } from '@/types/backend'

const MODULE_LABEL: Record<ModuleType, string> = {
  PRODUCT_OVERVIEW: 'Product overview',
  INGREDIENTS: 'Ingredients',
  EQUIPMENT: 'Equipment',
  SOP: 'Standard procedure',
  TECHNIQUE: 'Technique',
  COMMON_MISTAKES: 'Common mistakes',
  EXCEPTION_HANDLING: 'Handling exceptions',
}

export const moduleLabel = (type: ModuleType) => MODULE_LABEL[type] ?? type

const COURSE_TYPE_LABEL: Record<string, string> = {
  INDUCTION: 'Induction',
  PRODUCT: 'Drink course',
  EQUIPMENT: 'Equipment',
  RECERTIFICATION: 'Recertification',
}

export const courseTypeLabel = (type: string) => COURSE_TYPE_LABEL[type] ?? type

/** "2026-12-01" or an ISO timestamp → "1 Dec 2026". */
export function fmtDay(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtDayTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${fmtDay(value)} · ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

/** "Chuẩn hóa Pha Chế: Trà sữa Oolong (R01)" → { lead: "Chuẩn hóa Pha Chế", name: "Trà sữa Oolong (R01)" }. */
export function splitTitle(title: string) {
  const at = title.indexOf(': ')
  return at > 0 ? { lead: title.slice(0, at), name: title.slice(at + 2) } : { lead: null, name: title }
}
