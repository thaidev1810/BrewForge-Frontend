import { useCallback, useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Panel } from '@/components/common/Panel'
import { Button } from '@/components/ui/button'
import {
  DataTable,
  ErrorBox,
  Field,
  JsonView,
  Loading,
  Select,
  StateBadge,
  SuccessBox,
  TextArea,
  TextInput,
  Toolbar,
  addDays,
  fmtDate,
  today,
  useAction,
} from '@/components/common/Kit'
import { useAsyncLoad } from '@/hooks/useAsyncLoad'
import { brewforgeApi } from '@/services/brewforgeApi'
import { AuditLogPanel } from '@/features/admin/AdminPages'
import type {
  BranchDto,
  BranchLaunchStatusDto,
  CriterionType,
  ImpactAnalysisDto,
  ImpactEntityType,
  LaunchDecisionType,
  PilotCriterion,
  PilotDto,
  PilotEvaluation,
  PilotReadinessDto,
  RecipeDto,
  SalesAggregateDto,
  SalesGrouping,
  VersionTraceDto,
} from '@/types/backend'

function useLookups() {
  const loader = useCallback(async () => {
    const [b, r] = await Promise.all([brewforgeApi.branches.list({ page: 1, size: 100 }), brewforgeApi.recipes.list({ page: 1, size: 100 })])
    return { branches: b.items, recipes: r.items }
  }, [])
  return useAsyncLoad(loader, { branches: [] as BranchDto[], recipes: [] as RecipeDto[] })
}

// ------------------------------------------------------------------ pilots

const emptyPilot = {
  recipeVersionId: '',
  name: '',
  startDate: addDays(1),
  endDate: addDays(29),
  minCertifiedStaff: 2,
  branchIds: [] as number[],
  criteria: [{ type: 'ABSOLUTE' as CriterionType, cupsPerDayPerBranch: 20 }] as PilotCriterion[],
}

export function PilotsPage() {
  const lookups = useLookups()
  const [stateFilter, setStateFilter] = useState('')
  const loader = useCallback(async () => (await brewforgeApi.pilots.list({ page: 1, size: 100, state: stateFilter || undefined })).items, [stateFilter])
  const pilots = useAsyncLoad<PilotDto[]>(loader, [])
  const launchesLoader = useCallback(() => brewforgeApi.pilots.listBranchLaunchStatus(), [])
  const launches = useAsyncLoad<BranchLaunchStatusDto[]>(launchesLoader, [])
  const action = useAction()
  const [form, setForm] = useState(emptyPilot)
  const [editing, setEditing] = useState<PilotDto | null>(null)
  const [selected, setSelected] = useState<PilotDto | null>(null)
  const [readiness, setReadiness] = useState<PilotReadinessDto | null>(null)
  const [evaluation, setEvaluation] = useState<PilotEvaluation | null>(null)
  const [decision, setDecision] = useState<{ type: LaunchDecisionType; note: string }>({ type: 'ROLLOUT', note: '' })

  const releasedRecipes = lookups.data.recipes.filter((r) => r.releasedVersionId)
  const branchCode = (id: number) => lookups.data.branches.find((b) => b.id === id)?.branchCode ?? `#${id}`

  const select = async (p: PilotDto) => {
    setSelected(p)
    setEvaluation(null)
    setReadiness(null)
    try {
      setReadiness(await brewforgeApi.pilots.readiness(p.id))
    } catch {
      /* shown on demand */
    }
  }

  const afterChange = (p: PilotDto) => {
    pilots.reload()
    launches.reload()
    void select(p)
  }

  const body = () => ({ ...form, recipeVersionId: Number(form.recipeVersionId) })

  const setCriterion = (i: number, patch: Partial<PilotCriterion>) =>
    setForm({ ...form, criteria: form.criteria.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) })

  return (
    <>
      <PageHeader title="Pilots & Launches" description="Plan a pilot, check readiness (certified staff coverage), go live, evaluate sales, decide ROLLOUT/REVISE/DISCONTINUE, and manage branch launches." />
      <ErrorBox error={action.error ?? pilots.error ?? lookups.error} />
      <SuccessBox message={action.message} />

      <Panel title={editing ? `Edit pilot #${editing.id} (DRAFT only)` : 'Plan a pilot'}>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Released recipe version">
            <Select value={form.recipeVersionId} onChange={(e) => setForm({ ...form, recipeVersionId: e.target.value })}>
              <option value="">—</option>
              {releasedRecipes.map((r) => <option key={r.id} value={r.releasedVersionId ?? ''}>{r.recipeCode} · {r.name} · v{r.releasedVersionNo} (#{r.releasedVersionId})</option>)}
            </Select>
          </Field>
          <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Min certified staff per branch"><TextInput type="number" value={form.minCertifiedStaff} onChange={(e) => setForm({ ...form, minCertifiedStaff: Number(e.target.value) })} /></Field>
          <Field label="Start date"><TextInput type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="End date"><TextInput type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          <Field label="Pilot branches">
            <div className="flex flex-wrap gap-3 pt-2">
              {lookups.data.branches.map((b) => (
                <label key={b.id} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={form.branchIds.includes(b.id)} onChange={(e) => setForm({ ...form, branchIds: e.target.checked ? [...form.branchIds, b.id] : form.branchIds.filter((x) => x !== b.id) })} />
                  {b.branchCode}
                </label>
              ))}
            </div>
          </Field>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium">Success criteria</p>
          {form.criteria.map((c, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-6">
              <Select value={c.type} onChange={(e) => setCriterion(i, { type: e.target.value as CriterionType })}>
                <option>ABSOLUTE</option><option>RELATIVE</option><option>RETENTION</option>
              </Select>
              {c.type === 'ABSOLUTE' && <TextInput type="number" placeholder="cups/day/branch" value={c.cupsPerDayPerBranch ?? ''} onChange={(e) => setCriterion(i, { cupsPerDayPerBranch: Number(e.target.value) })} />}
              {c.type === 'RELATIVE' && (
                <>
                  <Select value={c.controlRecipeId ?? ''} onChange={(e) => setCriterion(i, { controlRecipeId: Number(e.target.value) })}>
                    <option value="">control recipe…</option>
                    {lookups.data.recipes.map((r) => <option key={r.id} value={r.id}>{r.recipeCode}</option>)}
                  </Select>
                  <TextInput type="number" placeholder="min % of control" value={c.minPercentOfControl ?? ''} onChange={(e) => setCriterion(i, { minPercentOfControl: Number(e.target.value) })} />
                </>
              )}
              {c.type === 'RETENTION' && <TextInput type="number" placeholder="max drop % 2nd half" value={c.maxDropSecondHalfPct ?? ''} onChange={(e) => setCriterion(i, { maxDropSecondHalfPct: Number(e.target.value) })} />}
              <Button size="sm" variant="outline" onClick={() => setForm({ ...form, criteria: form.criteria.filter((_, idx) => idx !== i) })}>Remove</Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setForm({ ...form, criteria: [...form.criteria, { type: 'RETENTION', maxDropSecondHalfPct: 30 }] })}>+ Criterion</Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" disabled={action.busy} onClick={() => void action.run(() => (editing ? brewforgeApi.pilots.update(editing.id, body()) : brewforgeApi.pilots.create(body())), (p) => `Pilot #${p.id} saved.`, (p) => { setEditing(null); setForm(emptyPilot); afterChange(p) })}>
            {editing ? 'Save pilot' : 'Create pilot'}
          </Button>
          {editing && <Button size="sm" variant="outline" onClick={() => { setEditing(null); setForm(emptyPilot) }}>Cancel</Button>}
        </div>
      </Panel>

      <Panel title="Pilots">
        <Toolbar>
          <Field label="State">
            <Select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <option value="">All</option><option>DRAFT</option><option>RUNNING</option><option>ENDED</option><option>CANCELLED</option>
            </Select>
          </Field>
        </Toolbar>
        <Loading show={pilots.loading} />
        <DataTable
          rows={pilots.data}
          rowKey={(p) => p.id}
          selectedKey={selected?.id}
          onRowClick={(p) => void select(p)}
          columns={[
            { header: 'ID', cell: (p) => p.id },
            { header: 'Name', cell: (p) => p.name },
            { header: 'Recipe', cell: (p) => `${p.recipeCode} v${p.versionNo}` },
            { header: 'Period', cell: (p) => `${p.startDate} → ${p.endDate}` },
            { header: 'Branches', cell: (p) => p.branches.map((b) => `${b.branchCode}:${b.readinessState}`).join(', ') },
            { header: 'State', cell: (p) => <StateBadge value={p.state} /> },
            { header: 'Decision', cell: (p) => p.decision?.decision ?? '—' },
          ]}
        />
      </Panel>

      {selected && (
        <Panel title={`Pilot #${selected.id} · ${selected.name}`} description={`${selected.recipeCode} v${selected.versionNo} · min certified staff ${selected.minCertifiedStaff}`}>
          <div className="mb-3 flex flex-wrap gap-2">
            {selected.state === 'DRAFT' && (
              <>
                <Button size="sm" variant="outline" onClick={() => { setEditing(selected); setForm({ recipeVersionId: String(selected.recipeVersionId), name: selected.name, startDate: selected.startDate, endDate: selected.endDate, minCertifiedStaff: selected.minCertifiedStaff, branchIds: selected.branches.map((b) => b.branchId), criteria: selected.criteria }) }}>Edit</Button>
                <Button size="sm" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.pilots.start(selected.id), 'Pilot started.', afterChange)}>Start pilot</Button>
              </>
            )}
            {(selected.state === 'DRAFT' || selected.state === 'RUNNING') && (
              <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.pilots.cancel(selected.id), 'Pilot cancelled.', afterChange)}>Cancel pilot</Button>
            )}
            <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.pilots.readiness(selected.id), 'Readiness refreshed.', setReadiness)}>Refresh readiness</Button>
            <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.pilots.evaluation(selected.id), 'Evaluation computed.', setEvaluation)}>Evaluate sales</Button>
          </div>

          {readiness && (
            <DataTable
              rows={readiness.branches}
              rowKey={(b) => b.branchId}
              columns={[
                { header: 'Branch', cell: (b) => b.branchCode ?? b.branchId },
                { header: 'Readiness', cell: (b) => <StateBadge value={b.readinessState} /> },
                { header: 'Certified', cell: (b) => `${b.certifiedCount}/${b.minCertifiedStaff}` },
                { header: 'Coverage', cell: (b) => (b.coverageMet ? 'met' : 'not met') },
                { header: 'Launch', cell: (b) => <StateBadge value={b.launchStatus} /> },
                { header: 'Live since', cell: (b) => fmtDate(b.wentLiveAt) },
                {
                  header: '',
                  cell: (b) =>
                    b.readinessState !== 'LIVE' && b.launchStatus !== 'LIVE' ? (
                      <Button size="sm" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.pilots.goLive(selected.id, b.branchId), `${b.branchCode} is live.`, afterChange)}>Go live</Button>
                    ) : null,
                },
              ]}
            />
          )}

          {evaluation && (
            <div className="mt-4 space-y-2">
              <p className="text-sm">
                Overall: <StateBadge value={evaluation.overall} /> · {evaluation.from} → {evaluation.to} · coverage {evaluation.coverageComplete ? 'complete' : 'incomplete'}
              </p>
              <DataTable
                rows={evaluation.criteria}
                rowKey={(c) => c.type}
                columns={[
                  { header: 'Criterion', cell: (c) => c.type },
                  { header: 'Target', cell: (c) => c.target },
                  { header: 'Actual', cell: (c) => c.actual ?? '—' },
                  { header: 'Verdict', cell: (c) => <StateBadge value={c.verdict} /> },
                ]}
              />
              <DataTable
                rows={evaluation.byBranch}
                rowKey={(b) => b.branchId}
                columns={[
                  { header: 'Branch', cell: (b) => branchCode(b.branchId) },
                  { header: 'Days', cell: (b) => `${b.tradingDays}/${b.expectedDays}` },
                  { header: 'Cups', cell: (b) => b.cupsTotal },
                  { header: 'Cups/day', cell: (b) => b.cupsPerDay },
                  { header: 'Verdict', cell: (b) => <StateBadge value={b.verdict} /> },
                ]}
              />
              <DataTable
                rows={evaluation.byWeek}
                rowKey={(w) => w.week}
                columns={[
                  { header: 'Week', cell: (w) => w.week },
                  { header: 'Range', cell: (w) => `${w.from} → ${w.to}` },
                  { header: 'Cups', cell: (w) => w.cups },
                ]}
              />
            </div>
          )}

          {(selected.state === 'ENDED' || selected.state === 'RUNNING') && !selected.decision && (
            <div className="mt-4 grid gap-2 md:grid-cols-4">
              <Field label="Decision">
                <Select value={decision.type} onChange={(e) => setDecision({ ...decision, type: e.target.value as LaunchDecisionType })}>
                  <option>ROLLOUT</option><option>REVISE</option><option>DISCONTINUE</option>
                </Select>
              </Field>
              <Field label="Note" className="md:col-span-2"><TextInput value={decision.note} onChange={(e) => setDecision({ ...decision, note: e.target.value })} /></Field>
              <div className="flex items-end">
                <Button size="sm" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.pilots.decide(selected.id, decision.type, decision.note), `Decision ${decision.type} recorded.`, afterChange)}>Record decision</Button>
              </div>
            </div>
          )}
          {selected.decision && (
            <div className="mt-4">
              <p className="text-sm">Decision: <strong>{selected.decision.decision}</strong> at {fmtDate(selected.decision.decidedAt)} by #{selected.decision.decidedBy}</p>
              <JsonView value={selected.decision.evaluated} />
            </div>
          )}
        </Panel>
      )}

      <Panel title="Branch launch status" description="Rollout branches are PREPARING until enough staff are certified; withdraw a live drink here.">
        <ErrorBox error={launches.error} />
        <DataTable
          rows={launches.data}
          rowKey={(l) => l.id}
          columns={[
            { header: 'Branch', cell: (l) => l.branchCode },
            { header: 'Recipe', cell: (l) => `${l.recipeCode} ${l.versionNo ? `v${l.versionNo}` : ''}` },
            { header: 'Origin', cell: (l) => l.origin ?? '—' },
            { header: 'Status', cell: (l) => <StateBadge value={l.status} /> },
            { header: 'Certified', cell: (l) => `${l.certifiedCount}/${l.minCertifiedStaff}${l.shortfall > 0 ? ` (short ${l.shortfall})` : ''}` },
            { header: 'Live since', cell: (l) => fmtDate(l.liveSince) },
            {
              header: '',
              cell: (l) =>
                l.status === 'LIVE' ? (
                  <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.pilots.withdrawBranchLaunch(l.id), `Withdrawn at ${l.branchCode}.`, launches.reload)}>Withdraw</Button>
                ) : null,
            },
          ]}
        />
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------ impact analysis

export function ImpactAnalysisPage() {
  const action = useAction()
  const [entityType, setEntityType] = useState<ImpactEntityType>('Ingredient')
  const [entityId, setEntityId] = useState('')
  const [runId, setRunId] = useState('')
  const [result, setResult] = useState<ImpactAnalysisDto | null>(null)
  const optionsLoader = useCallback(async () => {
    const [i, e] = await Promise.all([brewforgeApi.ingredients.list({ page: 1, size: 100 }), brewforgeApi.equipment.list({ page: 1, size: 100 })])
    return { ingredients: i.items, equipment: e.items }
  }, [])
  const options = useAsyncLoad(optionsLoader, { ingredients: [] as Awaited<ReturnType<typeof brewforgeApi.ingredients.list>>['items'], equipment: [] as Awaited<ReturnType<typeof brewforgeApi.equipment.list>>['items'] })

  return (
    <>
      <PageHeader title="Impact Analysis" description="What-if a master-data item or recipe version changes. Commit marks courses OUT_OF_DATE and certificates NEEDS_RECERT." />
      <ErrorBox error={action.error ?? options.error} />
      <SuccessBox message={action.message} />
      <Panel title="Run analysis">
        <Toolbar>
          <Field label="Entity type">
            <Select value={entityType} onChange={(e) => { setEntityType(e.target.value as ImpactEntityType); setEntityId('') }}>
              <option>Ingredient</option><option>StandardEquipment</option><option>RecipeVersion</option>
            </Select>
          </Field>
          <Field label="Entity">
            {entityType === 'Ingredient' ? (
              <Select value={entityId} onChange={(e) => setEntityId(e.target.value)}>
                <option value="">—</option>
                {options.data.ingredients.map((i) => <option key={i.id} value={i.id}>{i.ingredientCode} · {i.name}</option>)}
              </Select>
            ) : entityType === 'StandardEquipment' ? (
              <Select value={entityId} onChange={(e) => setEntityId(e.target.value)}>
                <option value="">—</option>
                {options.data.equipment.map((i) => <option key={i.id} value={i.id}>{i.equipmentCode} · {i.equipmentClass}</option>)}
              </Select>
            ) : (
              <TextInput placeholder="recipe version id" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
            )}
          </Field>
          <Button size="sm" disabled={action.busy || !entityId} onClick={() => void action.run(() => brewforgeApi.impact.analyze(entityType, Number(entityId)), (r) => `Run ${r.runId} computed.`, (r) => { setResult(r); setRunId(r.runId) })}>Analyze (what-if)</Button>
        </Toolbar>
        <Toolbar>
          <Field label="Existing run ID"><TextInput value={runId} onChange={(e) => setRunId(e.target.value)} /></Field>
          <Button size="sm" variant="outline" disabled={!runId} onClick={() => void action.run(() => brewforgeApi.impact.get(runId), 'Run loaded.', setResult)}>Load run</Button>
        </Toolbar>
      </Panel>
      {result && (
        <Panel
          title={`Run ${result.runId}`}
          description={`${result.trigger.entityType} #${result.trigger.entityId} · ${result.committed ? 'COMMITTED' : 'what-if only'}`}
          action={!result.committed && <Button size="sm" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.impact.commit(result.runId), 'Impact committed.', setResult)}>Commit impact</Button>}
        >
          {result.warning && <p className="mb-3 text-sm text-amber-800">[{result.warning.code}] {result.warning.message}</p>}
          <p className="mb-2 text-sm">Affected recipe versions: {result.affected.recipeVersions.join(', ') || 'none'}</p>
          <h3 className="mt-3 text-sm font-semibold">Courses</h3>
          <DataTable rows={result.affected.courses} rowKey={(c) => c.id} columns={[{ header: 'Course', cell: (c) => `#${c.id} ${c.title ?? ''}` }, { header: 'Impact', cell: (c) => c.impact }, { header: 'State', cell: (c) => <StateBadge value={c.state} /> }]} />
          <h3 className="mt-3 text-sm font-semibold">Certificates</h3>
          <DataTable rows={result.affected.certificates} rowKey={(c) => c.id} columns={[{ header: 'Cert', cell: (c) => `#${c.id}` }, { header: 'Holder', cell: (c) => c.fullName ?? c.userId }, { header: 'Impact', cell: (c) => c.impact }, { header: 'Status', cell: (c) => <StateBadge value={c.status} /> }]} />
          <h3 className="mt-3 text-sm font-semibold">Live branches</h3>
          <DataTable rows={result.affected.liveBranches} rowKey={(b) => `${b.branchId}-${b.recipeId}`} columns={[{ header: 'Branch', cell: (b) => b.branchCode ?? b.branchId }, { header: 'Recipe', cell: (b) => b.recipeId }, { header: 'Version', cell: (b) => b.recipeVersionId ?? '—' }, { header: 'Impact', cell: (b) => b.impact }]} />
        </Panel>
      )}
    </>
  )
}

// ------------------------------------------------------------------ sales & analytics (RD manager + training manager)

export function SalesAggregatePanel() {
  const lookups = useLookups()
  const action = useAction()
  const [params, setParams] = useState({ recipeId: '', groupBy: 'BRANCH' as SalesGrouping, branchId: '', from: addDays(-60), to: today(), controlRecipeId: '' })
  const [result, setResult] = useState<SalesAggregateDto | null>(null)

  return (
    <Panel title="Sales aggregate" description="Cups per branch/day/week with optional control drink comparison.">
      <ErrorBox error={action.error ?? lookups.error} />
      <Toolbar>
        <Field label="Recipe">
          <Select value={params.recipeId} onChange={(e) => setParams({ ...params, recipeId: e.target.value })}>
            <option value="">—</option>
            {lookups.data.recipes.map((r) => <option key={r.id} value={r.id}>{r.recipeCode} · {r.name}</option>)}
          </Select>
        </Field>
        <Field label="Group by">
          <Select value={params.groupBy} onChange={(e) => setParams({ ...params, groupBy: e.target.value as SalesGrouping })}><option>BRANCH</option><option>DAY</option><option>WEEK</option></Select>
        </Field>
        <Field label="Branch">
          <Select value={params.branchId} onChange={(e) => setParams({ ...params, branchId: e.target.value })}>
            <option value="">All</option>
            {lookups.data.branches.map((b) => <option key={b.id} value={b.id}>{b.branchCode}</option>)}
          </Select>
        </Field>
        <Field label="From"><TextInput type="date" value={params.from} onChange={(e) => setParams({ ...params, from: e.target.value })} /></Field>
        <Field label="To"><TextInput type="date" value={params.to} onChange={(e) => setParams({ ...params, to: e.target.value })} /></Field>
        <Field label="Control recipe">
          <Select value={params.controlRecipeId} onChange={(e) => setParams({ ...params, controlRecipeId: e.target.value })}>
            <option value="">—</option>
            {lookups.data.recipes.map((r) => <option key={r.id} value={r.id}>{r.recipeCode}</option>)}
          </Select>
        </Field>
        <Button
          size="sm"
          disabled={action.busy || !params.recipeId}
          onClick={() =>
            void action.run(
              () =>
                brewforgeApi.sales.aggregate({
                  recipeId: Number(params.recipeId),
                  groupBy: params.groupBy,
                  branchId: params.branchId ? Number(params.branchId) : undefined,
                  from: params.from || undefined,
                  to: params.to || undefined,
                  controlRecipeId: params.controlRecipeId ? Number(params.controlRecipeId) : undefined,
                }),
              undefined,
              setResult,
            )
          }
        >
          Aggregate
        </Button>
      </Toolbar>
      {result && (
        <>
          <p className="mb-2 text-sm">
            {result.recipeCode}: <strong>{result.totalCups}</strong> cups over {result.tradingDays} trading days ({result.cupsPerDay}/day)
            {result.controlRecipeCode && ` · control ${result.controlRecipeCode}: ${result.controlCups} cups (${result.percentOfControl ?? '—'}%)`}
          </p>
          <DataTable
            rows={result.groups}
            rowKey={(g) => g.key}
            columns={[
              { header: 'Group', cell: (g) => g.branchCode ?? g.key },
              { header: 'Range', cell: (g) => `${g.from} → ${g.to}` },
              { header: 'Cups', cell: (g) => g.cups },
              { header: 'Days', cell: (g) => g.tradingDays },
              { header: 'Cups/day', cell: (g) => g.cupsPerDay },
              { header: 'Change %', cell: (g) => g.changePct ?? '—' },
              { header: '% of control', cell: (g) => g.percentOfControl ?? '—' },
            ]}
          />
        </>
      )}
    </Panel>
  )
}

export function BranchPerformancePanel() {
  const [range, setRange] = useState({ from: addDays(-30), to: today() })
  const loader = useCallback(() => brewforgeApi.dashboards.branchPerformance({ from: range.from || undefined, to: range.to || undefined }), [range])
  const perf = useAsyncLoad(loader, { from: '', to: '', rows: [] })
  return (
    <Panel title="Branch performance" description="Live drinks per branch with certified staff coverage and cups per day.">
      <ErrorBox error={perf.error} />
      <Toolbar>
        <Field label="From"><TextInput type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></Field>
        <Field label="To"><TextInput type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></Field>
      </Toolbar>
      <Loading show={perf.loading} />
      <DataTable
        rows={perf.data.rows}
        rowKey={(r) => `${r.branchId}-${r.recipeId}`}
        columns={[
          { header: 'Branch', cell: (r) => r.branchCode },
          { header: 'Recipe', cell: (r) => `${r.recipeCode} v${r.versionNo ?? '—'}` },
          { header: 'Status', cell: (r) => <StateBadge value={r.status} /> },
          { header: 'Certified', cell: (r) => `${r.certifiedCount}/${r.minCertifiedStaff}` },
          { header: 'Cups', cell: (r) => r.cupsTotal },
          { header: 'Cups/day', cell: (r) => r.cupsPerDay },
          { header: 'Last sale', cell: (r) => r.lastTradingDate ?? '—' },
        ]}
      />
    </Panel>
  )
}

export function TrainingProgressPanel() {
  const loader = useCallback(() => brewforgeApi.dashboards.trainingProgress(), [])
  const progress = useAsyncLoad(loader, [])
  return (
    <Panel title="Training progress" description="Per branch and course.">
      <ErrorBox error={progress.error} />
      <Loading show={progress.loading} />
      <DataTable
        rows={progress.data}
        rowKey={(r) => `${r.branchId}-${r.courseId}`}
        columns={[
          { header: 'Branch', cell: (r) => r.branchCode ?? 'HQ' },
          { header: 'Course', cell: (r) => r.courseTitle },
          { header: 'Assigned', cell: (r) => r.assigned },
          { header: 'In progress', cell: (r) => r.inProgress },
          { header: 'Eligible', cell: (r) => r.eligible },
          { header: 'Passed', cell: (r) => r.passed },
          { header: 'Locked', cell: (r) => r.locked },
          { header: 'Overdue', cell: (r) => r.overdue },
          { header: 'Valid certs', cell: (r) => r.certifiedValid },
          { header: 'Needs recert', cell: (r) => r.needsRecertification },
        ]}
      />
    </Panel>
  )
}

export function CourseEffectivenessPanel() {
  const loader = useCallback(() => brewforgeApi.dashboards.courseEffectiveness(), [])
  const data = useAsyncLoad(loader, [])
  return (
    <Panel title="Course effectiveness" description="First-attempt pass rate, retakes, attendance, time to certification; weak modules highlighted.">
      <ErrorBox error={data.error} />
      <Loading show={data.loading} />
      <div className="space-y-4">
        {data.data.map((c) => (
          <div key={c.courseId} className="rounded-lg border p-3 text-sm">
            <p className="font-semibold">
              {c.courseTitle} <StateBadge value={c.state} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Enrollments {c.enrollments} · passed {c.passed} · locked {c.locked} · 1st-attempt pass {c.firstAttemptPassRatePct ?? '—'}% · retakes {c.retakeAttempts} ({c.learnersWhoRetook} learners) ·
              attendance {c.attendanceRatePct ?? '—'}% · avg days to cert {c.avgDaysToCertification ?? '—'} · on time {c.onTimeCompletionRatePct ?? '—'}% · cups sold {c.cupsSold}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {c.modules.map((m) => (
                <span key={m.courseModuleId} className={`rounded px-2 py-1 text-xs ${m.highlighted ? 'bg-red-100 text-red-800' : 'bg-muted'}`}>
                  {m.moduleType}: {m.passRatePct ?? '—'}% ({m.passed}/{m.firstAttempts})
                </span>
              ))}
            </div>
          </div>
        ))}
        {data.data.length === 0 && !data.loading && <p className="text-sm text-muted-foreground">No course data yet.</p>}
      </div>
    </Panel>
  )
}

export function SalesAnalyticsPage() {
  return (
    <>
      <PageHeader title="Sales & Analytics" description="Sales aggregates, branch performance, training progress, and course effectiveness." />
      <SalesAggregatePanel />
      <BranchPerformancePanel />
      <TrainingProgressPanel />
      <CourseEffectivenessPanel />
    </>
  )
}

// ------------------------------------------------------------------ trace & compliance (RD manager + auditor)

export function TraceAndCompliancePanel() {
  const action = useAction()
  const [trace, setTrace] = useState<VersionTraceDto | null>(null)
  const [traceInput, setTraceInput] = useState({ entityType: 'RecipeVersion', entityId: '' })
  const [report, setReport] = useState({ from: addDays(-90), to: today(), branchId: '', courseId: '', recipeVersionId: '' })

  const download = (format: 'csv' | 'xlsx') =>
    void action.run(
      () =>
        brewforgeApi.audit.downloadComplianceReport({
          format,
          from: report.from || undefined,
          to: report.to || undefined,
          branchId: report.branchId ? Number(report.branchId) : undefined,
          courseId: report.courseId ? Number(report.courseId) : undefined,
          recipeVersionId: report.recipeVersionId ? Number(report.recipeVersionId) : undefined,
        }),
      `Compliance report (${format.toUpperCase()}) downloaded.`,
    )

  return (
    <>
      <ErrorBox error={action.error} />
      <SuccessBox message={action.message} />
      <Panel title="Version trace" description="Who authored/approved a version, its checks, AI drafts, courses, certified staff, branches and cups sold.">
        <Toolbar>
          <Field label="Entity type">
            <Select value={traceInput.entityType} onChange={(e) => setTraceInput({ ...traceInput, entityType: e.target.value })}>
              <option>RecipeVersion</option><option>Course</option><option>Certificate</option>
            </Select>
          </Field>
          <Field label="Entity ID"><TextInput value={traceInput.entityId} onChange={(e) => setTraceInput({ ...traceInput, entityId: e.target.value })} /></Field>
          <Button size="sm" disabled={action.busy || !traceInput.entityId} onClick={() => void action.run(() => brewforgeApi.audit.trace(traceInput.entityType, Number(traceInput.entityId)), undefined, setTrace)}>Trace</Button>
        </Toolbar>
        {trace && (
          <div className="space-y-3 text-sm">
            <p>
              <strong>{trace.version.recipeCode}</strong> {trace.version.recipeName} · v{trace.version.versionNo} <StateBadge value={trace.version.state} /> · author {trace.version.author?.fullName ?? '—'} · approver{' '}
              {trace.version.approver?.fullName ?? '—'} · released {fmtDate(trace.version.releasedAt)} · cups sold {trace.cupsSold}
            </p>
            <DataTable rows={trace.validation} rowKey={(v) => `${v.checkType}-${v.runAt}`} empty="No checks." columns={[{ header: 'Check', cell: (v) => v.checkType }, { header: 'Passed', cell: (v) => (v.passed ? 'yes' : 'no') }, { header: 'Violations', cell: (v) => v.violations }, { header: 'Run at', cell: (v) => fmtDate(v.runAt) }]} />
            <DataTable rows={trace.aiDrafts} rowKey={(d) => d.id} empty="No AI drafts." columns={[{ header: 'Draft', cell: (d) => `#${d.id} ${d.modelName}` }, { header: 'Schema valid', cell: (d) => (d.schemaValid ? 'yes' : 'no') }, { header: 'Prompt', cell: (d) => <span className="line-clamp-2 text-xs">{d.promptText}</span> }]} />
            <DataTable rows={trace.courses} rowKey={(c) => c.id} empty="No courses." columns={[{ header: 'Course', cell: (c) => `#${c.id} ${c.title}` }, { header: 'State', cell: (c) => <StateBadge value={c.state} /> }, { header: 'Approved by', cell: (c) => c.approvedBy?.fullName ?? '—' }]} />
            <DataTable rows={trace.certifiedStaff} rowKey={(c) => c.id} empty="No certified staff." columns={[{ header: 'Cert', cell: (c) => `#${c.id}` }, { header: 'Holder', cell: (c) => c.fullName }, { header: 'Branch', cell: (c) => c.branchCode ?? '—' }, { header: 'Status', cell: (c) => <StateBadge value={c.status} /> }]} />
            <DataTable rows={trace.branches} rowKey={(b) => b.branchId} empty="No branches." columns={[{ header: 'Branch', cell: (b) => b.branchCode }, { header: 'Status', cell: (b) => <StateBadge value={b.status} /> }, { header: 'Certified', cell: (b) => b.certifiedCount }, { header: 'Live since', cell: (b) => fmtDate(b.liveSince) }]} />
            <DataTable rows={trace.events} rowKey={(e) => e.id} empty="No events." columns={[{ header: 'When', cell: (e) => fmtDate(e.createdAt) }, { header: 'Who', cell: (e) => e.username ?? '—' }, { header: 'Action', cell: (e) => `${e.entityType} ${e.action}` }]} />
          </div>
        )}
      </Panel>
      <Panel title="Compliance report export" description="CSV or XLSX of certificates, audits and launches for the period.">
        <Toolbar>
          <Field label="From"><TextInput type="date" value={report.from} onChange={(e) => setReport({ ...report, from: e.target.value })} /></Field>
          <Field label="To"><TextInput type="date" value={report.to} onChange={(e) => setReport({ ...report, to: e.target.value })} /></Field>
          <Field label="Branch ID"><TextInput value={report.branchId} onChange={(e) => setReport({ ...report, branchId: e.target.value })} /></Field>
          <Field label="Course ID"><TextInput value={report.courseId} onChange={(e) => setReport({ ...report, courseId: e.target.value })} /></Field>
          <Field label="Recipe version ID"><TextInput value={report.recipeVersionId} onChange={(e) => setReport({ ...report, recipeVersionId: e.target.value })} /></Field>
          <Button size="sm" disabled={action.busy} onClick={() => download('csv')}>Download CSV</Button>
          <Button size="sm" variant="outline" disabled={action.busy} onClick={() => download('xlsx')}>Download XLSX</Button>
        </Toolbar>
      </Panel>
    </>
  )
}

export function ComplianceAndTracePage() {
  return (
    <>
      <PageHeader title="Trace & Compliance" description="Version trace, compliance exports and the audit log." />
      <TraceAndCompliancePanel />
      <AuditLogPanel />
    </>
  )
}

export function NotePanel({ note }: { note: string }) {
  return <TextArea readOnly value={note} />
}

