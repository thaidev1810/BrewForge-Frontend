import type { SopVersion } from '@/features/sops/sopTypes'

export interface QuizQuestion { id: string; prompt: string; options: string[]; answer: number }

// Deterministic, so a question looks the same on every render and the answer position is not always first.
function order(seed: string, size: number) {
  let hash = 2166136261
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0
  const indexes = Array.from({ length: size }, (_, index) => index)
  for (let i = size - 1; i > 0; i--) {
    hash = Math.imul(hash ^ i, 16777619) >>> 0
    const j = hash % (i + 1)
    ;[indexes[i], indexes[j]] = [indexes[j], indexes[i]]
  }
  return indexes
}

// The mock quiz records counts only, so questions are derived from the published SOP steps the course teaches.
// A real adapter serves its own questions and grades on the server.
export function buildQuiz(sops: SopVersion[]): QuizQuestion[] {
  return sops.flatMap((sop) => sop.steps.map((step, index) => {
    const others = sop.steps.filter((_, other) => other !== index).slice(0, 3)
    const id = `${sop.id}:${index}`
    if (!others.length) {
      return { id, prompt: `True or false: step 1 of “${sop.title}” is “${step}”.`, options: ['True', 'False'], answer: 0 }
    }
    const options = [step, ...others]
    const shuffled = order(id, options.length)
    return {
      id, prompt: `Which of these is step ${index + 1} of “${sop.title}”?`,
      options: shuffled.map((position) => options[position]), answer: shuffled.indexOf(0),
    }
  }))
}

// The practical checklist: every SOP step, plus the two safety items a trainer fails a trainee on outright.
export interface ChecklistItem { criterionId: string; label: string; critical: boolean }
export function buildChecklist(sops: SopVersion[]): ChecklistItem[] {
  return [
    { criterionId: 'safety-expiry', label: 'Checks ingredient expiry and opening dates', critical: true },
    { criterionId: 'safety-hygiene', label: 'Follows hygiene and food-safety rules', critical: true },
    ...sops.flatMap((sop) => sop.steps.map((step, index) => ({ criterionId: `${sop.id}:${index}`, label: step, critical: false }))),
  ]
}
