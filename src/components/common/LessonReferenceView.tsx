import { Gauge, TriangleAlert } from 'lucide-react'
import type { ModuleType } from '@/types/backend'

interface ReferenceProps {
  moduleType: ModuleType
  reference: Record<string, unknown> | null
}

function asArray(val: unknown): Record<string, unknown>[] {
  return Array.isArray(val) ? (val as Record<string, unknown>[]) : []
}

function asStr(val: unknown, fallback = '—'): string {
  return val == null || val === '' ? fallback : String(val)
}

function asNum(val: unknown): number | null {
  return typeof val === 'number' ? val : null
}

const steps = (val: unknown) => (Array.isArray(val) ? (val as number[]).map((s) => `Step ${s}`).join(', ') : '—')

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="ref-label">{label}</span>
      <p className="ref-value">{value}</p>
    </div>
  )
}

function GateNote({ title, text }: { title: string; text: string }) {
  return (
    <p className="ref-gate">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span><strong className="font-semibold">{title}</strong> {text}</span>
    </p>
  )
}

export function LessonReferenceView({ moduleType, reference }: ReferenceProps) {
  if (!reference) return null

  if (moduleType === 'PRODUCT_OVERVIEW') {
    const prepSec = asNum(reference.totalDurationSeconds) ?? asNum(reference.totalPrepSeconds) ?? 0
    return (
      <div className="ref-card grid gap-4 sm:grid-cols-4">
        <Item label="Recipe" value={`${asStr(reference.recipeCode)} · v${asStr(reference.versionNo)}`} />
        <Item label="Drink" value={asStr(reference.recipeName)} />
        <Item label="Category" value={`${asStr(reference.category)} · ${asStr(reference.stepCount)} steps`} />
        <Item label="Standard time" value={prepSec >= 60 ? `${Math.round(prepSec / 60)} min` : `${prepSec} s`} />
      </div>
    )
  }

  if (moduleType === 'INGREDIENTS') {
    const items = asArray(reference.ingredients)
    if (items.length === 0) return null
    return (
      <div className="ref-card overflow-x-auto !p-0">
        <table className="w-full text-left text-[13.5px]">
          <thead className="text-[12px] text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-2.5 font-medium">Ingredient</th>
              <th className="px-4 py-2.5 font-medium">Dose</th>
              <th className="px-4 py-2.5 font-medium">Shelf life</th>
              <th className="px-4 py-2.5 font-medium">Storage</th>
              <th className="px-4 py-2.5 font-medium">Used in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((ing, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2.5">
                  <span className="font-medium">{asStr(ing.name)}</span>
                  <span className="ml-2 font-mono text-[11.5px] text-muted-foreground">{asStr(ing.ingredientCode)}</span>
                </td>
                <td className="px-4 py-2.5 font-semibold tabular-nums">{asStr(ing.totalQuantity)} {asStr(ing.unit, '')}</td>
                <td className="px-4 py-2.5 tabular-nums">{asStr(ing.shelfLifeHours)} h</td>
                <td className="px-4 py-2.5 text-muted-foreground">{asStr(ing.storageRule)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{steps(ing.usedInSteps)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (moduleType === 'EQUIPMENT') {
    const eqList = asArray(reference.equipment)
    if (eqList.length === 0) return null
    return (
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {eqList.map((eq, idx) => (
          <div key={idx} className="ref-card !mt-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{asStr(eq.equipmentClass)}</span>
              <span className="font-mono text-[11.5px] text-muted-foreground">{asStr(eq.equipmentCode)}</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[13.5px]">
              <Gauge className="size-3.5 text-muted-foreground" aria-hidden="true" />
              Safe range <strong className="tabular-nums">{asStr(eq.minThreshold)} – {asStr(eq.maxThreshold)} {asStr(eq.dosingUnit, '')}</strong>
            </p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">Used in {steps(eq.usedInSteps)}</p>
          </div>
        ))}
      </div>
    )
  }

  if (moduleType === 'SOP') {
    const ings = asArray(reference.ingredients)
    const deps = Array.isArray(reference.dependsOnSteps) ? (reference.dependsOnSteps as number[]) : []
    return (
      <div className="ref-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--latte)] px-2.5 py-1 text-[12px] font-semibold text-[var(--ink-fg)]">Step {asStr(reference.stepOrder)}</span>
          {reference.equipmentClass != null && <span className="chip font-mono">{asStr(reference.equipmentClass)}</span>}
          {reference.durationSeconds != null && <span className="chip tabular-nums">{asStr(reference.durationSeconds)} s</span>}
          {deps.length > 0 && <span className="text-[12.5px] text-muted-foreground">After {deps.map((d) => `step ${d}`).join(', ')}</span>}
        </div>
        <p className="mt-3 text-[15px] font-medium leading-relaxed">{asStr(reference.actionText)}</p>
        {ings.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ings.map((i, idx) => (
              <span key={idx} className="chip">
                {asStr(i.name)} <strong className="tabular-nums">{asStr(i.quantity)} {asStr(i.unit, '')}</strong>
              </span>
            ))}
          </div>
        )}
        {reference.techniqueGate != null && <GateNote title="Check:" text={asStr(reference.techniqueGate)} />}
      </div>
    )
  }

  if (moduleType === 'TECHNIQUE') {
    return (
      <div className="ref-card">
        <span className="ref-label">Observation point · step {asStr(reference.stepOrder)}</span>
        <p className="mt-1 text-[15px] font-medium leading-relaxed">{asStr(reference.actionText)}</p>
        {reference.techniqueGate != null && <GateNote title="Pass criterion:" text={asStr(reference.techniqueGate)} />}
      </div>
    )
  }

  return null
}
