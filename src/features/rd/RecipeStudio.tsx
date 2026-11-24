import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/common/Panel'
import {
  DataTable,
  ErrorBox,
  Field,
  Loading,
  Select,
  StateBadge,
  SuccessBox,
  TextArea,
  TextInput,
  fmtDate,
  useAction,
} from '@/components/common/Kit'
import { useAsyncLoad } from '@/hooks/useAsyncLoad'
import { brewforgeApi, newIdempotencyKey } from '@/services/brewforgeApi'
import type {
  RecipeDto,
  RecipeVersionDto,
  RecipeVersionSummaryDto,
  ReviewAction,
  ValidationResultDto,
} from '@/types/backend'
import { emptyRow, stepsToRows, rowsToSteps, type StepRow } from './stepUtils'

export { stepsToRows, rowsToSteps }
export type { StepRow }

export function StepEditor({ rows, onChange, readOnly }: { rows: StepRow[]; onChange: (rows: StepRow[]) => void; readOnly?: boolean }) {
  const update = (i: number, patch: Partial<StepRow>) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const move = (i: number, delta: number) => {
    const j = i + delta
    if (j < 0 || j >= rows.length) return
    const next = [...rows]
      ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Ingredients: <code>CODE qty unit</code> separated by commas (e.g. <code>ING01 18 g, ING05 150 ml</code>). Depends on: step numbers,
        optionally <code>2:REQUIRES_OUTPUT</code>.
      </p>
      {rows.map((row, i) => (
        <div key={i} className="grid gap-2 rounded-lg border p-2 md:grid-cols-12">
          <div className="text-xs font-semibold md:col-span-12">Step {i + 1}</div>
          <Field label="Action" className="md:col-span-4"><TextInput disabled={readOnly} value={row.actionText} onChange={(e) => update(i, { actionText: e.target.value })} /></Field>
          <Field label="Equipment class" className="md:col-span-2"><TextInput disabled={readOnly} value={row.equipmentClass} onChange={(e) => update(i, { equipmentClass: e.target.value })} /></Field>
          <Field label="Technique gate" className="md:col-span-2"><TextInput disabled={readOnly} value={row.techniqueGate} onChange={(e) => update(i, { techniqueGate: e.target.value })} /></Field>
          <Field label="Seconds" className="md:col-span-1"><TextInput disabled={readOnly} type="number" value={row.durationSeconds} onChange={(e) => update(i, { durationSeconds: e.target.value })} /></Field>
          <Field label="Depends on" className="md:col-span-3"><TextInput disabled={readOnly} value={row.dependsOn} onChange={(e) => update(i, { dependsOn: e.target.value })} /></Field>
          <Field label="Ingredients" className="md:col-span-9"><TextInput disabled={readOnly} value={row.ingredients} onChange={(e) => update(i, { ingredients: e.target.value })} /></Field>
          {!readOnly && (
            <div className="flex items-end gap-1 md:col-span-3">
              <Button size="sm" variant="outline" type="button" onClick={() => move(i, -1)}>↑</Button>
              <Button size="sm" variant="outline" type="button" onClick={() => move(i, 1)}>↓</Button>
              <Button size="sm" variant="outline" type="button" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}>Remove</Button>
            </div>
          )}
        </div>
      ))}
      {!readOnly && (
        <Button size="sm" variant="outline" type="button" onClick={() => onChange([...rows, emptyRow()])}>
          + Add step
        </Button>
      )}
    </div>
  )
}

export function ValidationView({ result }: { result: ValidationResultDto | null }) {
  if (!result) return null
  return (
    <div className="mt-3 rounded-lg border p-3 text-sm">
      <p className="mb-2 font-medium">
        3-check validation: <StateBadge value={result.passed ? 'PASSED' : 'FAILED'} /> <span className="text-xs text-muted-foreground">{fmtDate(result.runAt)}</span>
      </p>
      <div className="grid gap-2 md:grid-cols-3">
        {result.checks.map((check) => (
          <div key={check.checkType} className="rounded border p-2">
            <p className="text-xs font-semibold">
              {check.checkType} <StateBadge value={check.passed ? 'PASSED' : 'FAILED'} />
            </p>
            <ul className="mt-1 space-y-1 text-xs">
              {check.violations.map((v, idx) => (
                <li key={idx} className="text-red-700">
                  {v.stepOrder != null ? `Step ${v.stepOrder}: ` : ''}[{v.rule}] {v.message} (expected {v.expected}, actual {v.actual})
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Version history + editor of one recipe. `author` mode is the R&D specialist
 * (edit, AI draft, validate, repair, submit). `review` mode is the R&D manager
 * (validate, per-step review, idempotent release, rollback).
 */
export function RecipeVersionStudio({ recipe, mode, onChanged }: { recipe: RecipeDto; mode: 'author' | 'review'; onChanged?: () => void }) {
  const versionsLoader = useCallback(() => brewforgeApi.recipes.listVersions(recipe.id), [recipe.id])
  const versions = useAsyncLoad<RecipeVersionSummaryDto[]>(versionsLoader, [])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [version, setVersion] = useState<RecipeVersionDto | null>(null)
  const [rows, setRows] = useState<StepRow[]>([])
  const [validation, setValidation] = useState<ValidationResultDto | null>(null)
  const [description, setDescription] = useState('')
  const [aiInfo, setAiInfo] = useState<string | null>(null)
  const [decisions, setDecisions] = useState<Record<number, { action: ReviewAction; editedText: string }>>({})
  const [releaseKey, setReleaseKey] = useState(newIdempotencyKey)
  const action = useAction()

  const loadVersion = useCallback(async (id: number) => {
    const v = await brewforgeApi.recipeVersions.get(id)
    setVersion(v)
    setRows(stepsToRows(v.steps))
    setDecisions(Object.fromEntries(v.steps.map((s) => [s.id, { action: 'ACCEPT' as ReviewAction, editedText: s.actionText }])))
  }, [])

  const effectiveId = selectedId ?? versions.data[versions.data.length - 1]?.id ?? null
  useEffect(() => {
    if (effectiveId == null) return
    let active = true
    loadVersion(effectiveId)
      .then(() => {
        if (active) {
          setValidation(null)
          setAiInfo(null)
        }
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [effectiveId, loadVersion])

  const refresh = async (id?: number) => {
    versions.reload()
    if (id ?? effectiveId) await loadVersion((id ?? effectiveId) as number)
    onChanged?.()
  }

  const editable = mode === 'author' && version != null && !version.isImmutable && version.state === 'DRAFT'

  return (
    <Panel title={`${recipe.recipeCode} · ${recipe.name}`} description={`${recipe.category} · ${recipe.origin} · ${recipe.status}`}>
      <ErrorBox error={action.error ?? versions.error} />
      <SuccessBox message={action.message} />
      <Loading show={versions.loading} />
      <DataTable
        rows={versions.data}
        rowKey={(v) => v.id}
        selectedKey={effectiveId}
        onRowClick={(v) => setSelectedId(v.id)}
        empty="No versions yet."
        columns={[
          { header: 'Version', cell: (v) => `#${v.id} · v${v.versionNo}` },
          { header: 'State', cell: (v) => <StateBadge value={v.state} /> },
          { header: 'Steps', cell: (v) => v.stepCount },
          { header: 'Last check', cell: (v) => (v.lastValidationPassed == null ? '—' : v.lastValidationPassed ? 'passed' : 'failed') },
          { header: 'Released', cell: (v) => fmtDate(v.releasedAt) },
        ]}
      />
      {mode === 'author' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.recipes.createVersion(recipe.id), (v) => `Created empty draft #${v.id}.`, (v) => { setSelectedId(v.id); void refresh(v.id) })}>
            New empty draft
          </Button>
          {version && (
            <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.recipes.createVersion(recipe.id, version.id), (v) => `Copied v${version.versionNo} to draft #${v.id}.`, (v) => { setSelectedId(v.id); void refresh(v.id) })}>
              Copy selected to new draft
            </Button>
          )}
        </div>
      )}

      {version && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">Version #{version.id}</span>
            <StateBadge value={version.state} />
            {version.isImmutable && <span className="text-xs text-muted-foreground">immutable · hash {version.contentHash?.slice(0, 12)}</span>}
            <span className="text-xs text-muted-foreground">author #{version.createdBy}{version.approvedBy ? ` · approver #${version.approvedBy}` : ''}</span>
          </div>

          {mode === 'author' && editable && (
            <div className="rounded-lg border p-3">
              <Field label="AI draft: describe the drink (replaces the content of this draft)">
                <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Iced peach tea, 500ml, shaken, with peach syrup…" />
              </Field>
              <Button
                size="sm"
                className="mt-2"
                disabled={action.busy || !description.trim()}
                onClick={() =>
                  void action.run(() => brewforgeApi.recipeVersions.generateDraft(version.id, description), 'AI draft generated and validated.', (r) => {
                    setVersion(r.version)
                    setRows(stepsToRows(r.version.steps))
                    setValidation(r.validation)
                    setAiInfo(`Notes: ${r.notes ?? '—'} · Serving: ${r.servingSizeMl ?? '—'} ml · AI repairs used ${r.aiRepairsUsed}, left ${r.aiRepairsLeft}`)
                    versions.reload()
                  })
                }
              >
                Generate AI draft
              </Button>
              {aiInfo && <p className="mt-2 text-xs text-muted-foreground">{aiInfo}</p>}
            </div>
          )}

          <StepEditor rows={rows} onChange={setRows} readOnly={!editable} />

          <div className="flex flex-wrap gap-2">
            {editable && (
              <Button size="sm" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.recipeVersions.updateContent(version.id, { steps: rowsToSteps(rows) }), 'Content saved.', (v) => { setVersion(v); setRows(stepsToRows(v.steps)); versions.reload() })}>
                Save content
              </Button>
            )}
            {!version.isImmutable && (
              <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.recipeVersions.validate(version.id), (r) => (r.passed ? 'All 3 checks passed.' : 'Validation found violations.'), (r) => { setValidation(r); versions.reload() })}>
                Run 3-check validation
              </Button>
            )}
            {editable && (
              <>
                <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.recipeVersions.repair(version.id, 'AI'), 'AI repair applied.', (r) => { setVersion(r.version); setRows(stepsToRows(r.version.steps)); setValidation(r.validation); setAiInfo(`AI repairs used ${r.aiRepairsUsed}, left ${r.aiRepairsLeft}`) })}>
                  AI repair
                </Button>
                <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.recipeVersions.repair(version.id, 'MANUAL', { steps: rowsToSteps(rows) }), 'Manual repair applied and re-validated.', (r) => { setVersion(r.version); setRows(stepsToRows(r.version.steps)); setValidation(r.validation) })}>
                  Manual repair (save + validate)
                </Button>
                <Button size="sm" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.recipeVersions.submit(version.id), 'Submitted: version is VALIDATED and awaits R&D manager review.', (r) => { setValidation(r); void refresh() })}>
                  Submit for review
                </Button>
              </>
            )}
          </div>

          <ValidationView result={validation} />

          {mode === 'review' && version.state === 'VALIDATED' && (
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-semibold">Step-by-step review</p>
              <div className="space-y-2">
                {[...version.steps].sort((a, b) => a.stepOrder - b.stepOrder).map((step) => {
                  const d = decisions[step.id] ?? { action: 'ACCEPT' as ReviewAction, editedText: step.actionText }
                  return (
                    <div key={step.id} className="grid gap-2 md:grid-cols-12">
                      <span className="text-xs md:col-span-4">{step.stepOrder}. {step.actionText}</span>
                      <Select className="md:col-span-2" value={d.action} onChange={(e) => setDecisions({ ...decisions, [step.id]: { ...d, action: e.target.value as ReviewAction } })}>
                        <option>ACCEPT</option><option>EDIT</option><option>REJECT</option>
                      </Select>
                      {d.action === 'EDIT' && (
                        <TextInput className="md:col-span-6" value={d.editedText} onChange={(e) => setDecisions({ ...decisions, [step.id]: { ...d, editedText: e.target.value } })} />
                      )}
                    </div>
                  )
                })}
              </div>
              <Button
                size="sm"
                className="mt-3"
                disabled={action.busy}
                onClick={() =>
                  void action.run(
                    () => brewforgeApi.recipeVersions.review(version.id, Object.entries(decisions).map(([stepId, d]) => ({ stepId: Number(stepId), action: d.action, editedText: d.action === 'EDIT' ? d.editedText : null }))),
                    (r) => `Review outcome: ${r.outcome}.`,
                    () => void refresh(),
                  )
                }
              >
                Submit review
              </Button>
            </div>
          )}

          {mode === 'review' && (
            <div className="flex flex-wrap items-end gap-2">
              {version.state === 'VALIDATED' && (
                <>
                  <Field label="Idempotency-Key"><TextInput className="w-80" value={releaseKey} onChange={(e) => setReleaseKey(e.target.value)} /></Field>
                  <Button size="sm" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.recipeVersions.release(version.id, releaseKey), (r) => `Released v${r.version.versionNo}${r.replayed ? ' (replayed)' : ''}${r.supersededVersionId ? `, superseded #${r.supersededVersionId}` : ''}.`, () => { setReleaseKey(newIdempotencyKey()); void refresh() })}>
                    Release
                  </Button>
                </>
              )}
              {(version.state === 'SUPERSEDED' || version.state === 'RELEASED') && (
                <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.recipeVersions.rollback(version.id), (v) => `Rollback draft #${v.id} created from v${version.versionNo}.`, (v) => { setSelectedId(v.id); void refresh(v.id) })}>
                  Roll back to this version (creates a draft)
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}

