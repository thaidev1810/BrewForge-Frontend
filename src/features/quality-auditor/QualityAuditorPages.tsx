import { useCallback, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { PageHeader } from '@/components/common/PageHeader'
import { Panel } from '@/components/common/Panel'
import { Button } from '@/components/ui/button'
import {
  DataTable,
  ErrorBox,
  Field,
  Loading,
  Pager,
  Select,
  StateBadge,
  SuccessBox,
  TextInput,
  Toolbar,
  addDays,
  fmtDate,
  useAction,
} from '@/components/common/Kit'
import { useAsyncLoad } from '@/hooks/useAsyncLoad'
import { brewforgeApi } from '@/services/brewforgeApi'
import { AuthenticatedEvidenceImage } from '@/components/common/AuthenticatedMedia'
import { TraceAndCompliancePanel } from '@/features/rd/RdManagerPages'
import type {
  AuditItemRequest,
  AuditSummaryDto,
  BranchAuditDto,
  BranchDto,
  CorrectiveActionDto,
  CourseDto,
  RecipeDto,
} from '@/types/backend'

const PAGE_SIZE = 20

// ------------------------------------------------------------------ Branch Audits

/** Only the Quality Auditor records audits; the others read the history (a Branch Manager only that of their branch). */
const canRecordAudit = (role: string | undefined) => role === 'QUALITY_AUDITOR'
const canReadAuditSummary = (role: string | undefined) => role === 'QUALITY_AUDITOR' || role === 'RD_MANAGER' || role === 'ADMIN'

export function BranchAuditsPage({ embedded = false }: { embedded?: boolean }) {
  const role = useAppSelector((state) => state.auth.user?.role)
  const canRecord = canRecordAudit(role)
  const [page, setPage] = useState(1)
  const [branchFilter, setBranchFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('')

  const loader = useCallback(
    () =>
      brewforgeApi.quality.listAudits({
        page,
        size: PAGE_SIZE,
        branchId: branchFilter ? Number(branchFilter) : undefined,
        result: resultFilter || undefined,
      }),
    [page, branchFilter, resultFilter],
  )
  const audits = useAsyncLoad(loader, { items: [] as BranchAuditDto[], page: 1, size: PAGE_SIZE, total: 0 })

  const summaryLoader = useCallback(
    async () => (canReadAuditSummary(role) ? await brewforgeApi.quality.summary() : null),
    [role],
  )
  const summary = useAsyncLoad(summaryLoader, null as AuditSummaryDto | null)

  const lookupsLoader = useCallback(async () => {
    const [b, r] = await Promise.all([
      brewforgeApi.branches.list({ page: 1, size: 100 }),
      canRecord ? brewforgeApi.recipes.list({ page: 1, size: 100 }) : Promise.resolve({ items: [] as RecipeDto[] }),
    ])
    return { branches: b.items, recipes: r.items }
  }, [canRecord])
  const lookups = useAsyncLoad(lookupsLoader, { branches: [] as BranchDto[], recipes: [] as RecipeDto[] })

  const action = useAction()

  // New Audit Form
  const [auditBranchId, setAuditBranchId] = useState('')
  const [auditRecipeVersionId, setAuditRecipeVersionId] = useState('')
  const [auditComment, setAuditComment] = useState('')
  const [retrainingReq, setRetrainingReq] = useState(false)
  const [caDueDate, setCaDueDate] = useState(addDays(14))

  // Evidence upload
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [uploadedEvidenceUrl, setUploadedEvidenceUrl] = useState<string>('')

  // Checklist items
  const [items, setItems] = useState<AuditItemRequest[]>([
    { criterion: 'Water Temperature (88°C - 96°C)', expected: '92°C', actual: '92°C', passed: true, critical: true, comment: '', evidenceUrl: '' },
    { criterion: 'Espresso Dose Weight (18g ± 0.5g)', expected: '18.0g', actual: '18.2g', passed: true, critical: false, comment: '', evidenceUrl: '' },
    { criterion: 'Milk Steaming Texture & Temperature (<65°C)', expected: 'Microfoam', actual: 'Microfoam', passed: true, critical: false, comment: '', evidenceUrl: '' },
    { criterion: 'Cup Hygiene & Workspace Cleanliness', expected: 'Sanitized', actual: 'Clean', passed: true, critical: true, comment: '', evidenceUrl: '' },
  ])

  // Selected audit inspection
  const [selectedAudit, setSelectedAudit] = useState<BranchAuditDto | null>(null)

  const handleUploadEvidence = () => {
    if (!evidenceFile) return
    void action.run(
      () => brewforgeApi.quality.uploadEvidence(evidenceFile),
      (ev) => {
        setUploadedEvidenceUrl(ev.url)
        return 'Evidence photo uploaded.'
      },
    )
  }

  const handleSubmitAudit = () => {
    void action.run(
      () =>
        brewforgeApi.quality.createAudit({
          branchId: Number(auditBranchId),
          recipeVersionId: Number(auditRecipeVersionId),
          comment: auditComment,
          retrainingRequired: retrainingReq,
          dueDate: retrainingReq ? caDueDate : null,
          items,
        }),
      (res) =>
        res.result === 'PASSED'
          ? `Audit PASSED with score ${res.score}%!`
          : `Audit FAILED with score ${res.score}%. Corrective Action #${res.correctiveActionId ?? 'created'} opened!`,
      () => {
        audits.reload()
        summary.reload()
        setAuditComment('')
      },
    )
  }

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Branch Quality Audits"
          description="Conduct on-site SOP branch audits, upload photo evidence, score compliance against the pass mark, and trigger corrective actions."
        />
      )}
      <ErrorBox error={action.error ?? audits.error ?? lookups.error} />
      <SuccessBox message={action.message} />

      {summary.data && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Audits (Period)</p>
            <p className="text-2xl font-bold">{summary.data.audits}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Passed Audits</p>
            <p className="text-2xl font-bold text-green-700">{summary.data.passed}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Failed Audits</p>
            <p className="text-2xl font-bold text-destructive">{summary.data.failed}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Open Corrective Actions</p>
            <p className="text-2xl font-bold text-amber-700">{summary.data.openCorrectiveActions}</p>
          </div>
        </div>
      )}

      {canRecord && (
      <Panel title="Record New Quality Audit">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Branch">
            <Select value={auditBranchId} onChange={(e) => setAuditBranchId(e.target.value)}>
              <option value="">— select branch —</option>
              {lookups.data.branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branchCode} · {b.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Recipe / SOP Version">
            <Select value={auditRecipeVersionId} onChange={(e) => setAuditRecipeVersionId(e.target.value)}>
              <option value="">— select drink version —</option>
              {lookups.data.recipes
                .filter((r) => r.releasedVersionId)
                .map((r) => (
                  <option key={r.id} value={r.releasedVersionId ?? ''}>
                    {r.recipeCode} · {r.name} (v{r.releasedVersionNo})
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="General Audit Comment">
            <TextInput value={auditComment} onChange={(e) => setAuditComment(e.target.value)} placeholder="Observations..." />
          </Field>
        </div>

        <div className="mt-4 rounded border bg-muted/20 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Upload Audit Evidence (Photo)</h4>
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" accept="image/*" onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)} className="text-xs" />
            <Button size="sm" variant="outline" disabled={action.busy || !evidenceFile} onClick={handleUploadEvidence}>
              Upload Photo
            </Button>
            {uploadedEvidenceUrl && <span className="text-xs text-green-700">Photo URL ready!</span>}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Audit Checklist Criteria</h4>
          {items.map((it, idx) => (
            <div key={idx} className="rounded border bg-card p-3 text-xs grid gap-2 md:grid-cols-6">
              <div className="md:col-span-2">
                <Field label="Criterion"><TextInput value={it.criterion} onChange={(e) => { const v = e.target.value; setItems((prev) => prev.map((item, i) => i === idx ? { ...item, criterion: v } : item)) }} /></Field>
              </div>
              <div>
                <Field label="Expected"><TextInput value={it.expected ?? ''} onChange={(e) => { const v = e.target.value; setItems((prev) => prev.map((item, i) => i === idx ? { ...item, expected: v } : item)) }} /></Field>
              </div>
              <div>
                <Field label="Actual"><TextInput value={it.actual ?? ''} onChange={(e) => { const v = e.target.value; setItems((prev) => prev.map((item, i) => i === idx ? { ...item, actual: v } : item)) }} /></Field>
              </div>
              <div>
                <Field label="Evidence URL"><TextInput value={it.evidenceUrl ?? ''} placeholder="paste or use uploaded" onChange={(e) => { const v = e.target.value; setItems((prev) => prev.map((item, i) => i === idx ? { ...item, evidenceUrl: v } : item)) }} /></Field>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={it.passed} onChange={(e) => { const v = e.target.checked; setItems((prev) => prev.map((item, i) => i === idx ? { ...item, passed: v } : item)) }} />
                  {it.passed ? <span className="text-green-700 font-bold">PASS</span> : <span className="text-destructive font-bold">FAIL</span>}
                </label>
                <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <input type="checkbox" checked={it.critical} onChange={(e) => { const v = e.target.checked; setItems((prev) => prev.map((item, i) => i === idx ? { ...item, critical: v } : item)) }} />
                  Critical
                </label>
              </div>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                { criterion: 'New Check Item', expected: 'Standard', actual: 'Observed', passed: true, critical: false, comment: '', evidenceUrl: uploadedEvidenceUrl },
              ])
            }
          >
            + Add Criterion
          </Button>
        </div>

        <div className="mt-4 rounded border bg-amber-50/50 p-3 text-xs">
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" checked={retrainingReq} onChange={(e) => setRetrainingReq(e.target.checked)} />
            Require Mandatory Staff Retraining if Audit Fails
          </label>
          {retrainingReq && (
            <div className="mt-2 flex items-center gap-2">
              <Field label="Retraining Due Date">
                <TextInput type="date" value={caDueDate} onChange={(e) => setCaDueDate(e.target.value)} />
              </Field>
            </div>
          )}
        </div>

        <Button
          size="sm"
          className="mt-4"
          disabled={action.busy || !auditBranchId || !auditRecipeVersionId}
          onClick={handleSubmitAudit}
        >
          Submit Completed Audit
        </Button>
      </Panel>
      )}

      <Panel title={canRecord ? 'Audit History Log' : 'Audits at your branch'}>
        <Toolbar>
          {lookups.data.branches.length > 1 && (
            <Field label="Branch">
              <Select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1) }}>
                <option value="">All Branches</option>
                {lookups.data.branches.map((b) => <option key={b.id} value={b.id}>{b.branchCode}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Result">
            <Select value={resultFilter} onChange={(e) => { setResultFilter(e.target.value); setPage(1) }}>
              <option value="">All Results</option>
              <option value="PASSED">PASSED</option>
              <option value="FAILED">FAILED</option>
            </Select>
          </Field>
        </Toolbar>
        <Loading show={audits.loading} />
        <DataTable
          rows={audits.data.items}
          rowKey={(a) => a.id}
          selectedKey={selectedAudit?.id}
          onRowClick={setSelectedAudit}
          columns={[
            { header: 'Branch', cell: (a) => a.branchCode },
            { header: 'Recipe', cell: (a) => `${a.recipeCode} (v${a.versionNo})` },
            { header: 'Score', cell: (a) => `${a.score}%` },
            { header: 'Result', cell: (a) => <StateBadge value={a.result} /> },
            { header: 'Auditor', cell: (a) => a.auditorName ?? `#${a.auditorId}` },
            { header: 'Date', cell: (a) => fmtDate(a.auditedAt) },
            { header: 'Corrective Action', cell: (a) => (a.correctiveActionId ? `#${a.correctiveActionId}` : '—') },
          ]}
        />
        <Pager page={page} size={PAGE_SIZE} total={audits.data.total} onPage={setPage} />
      </Panel>

      {selectedAudit && (
        <Panel
          title={`Audit #${selectedAudit.id} Inspection: ${selectedAudit.branchCode} · ${selectedAudit.recipeCode}`}
          description={`Score: ${selectedAudit.score}% · Result: ${selectedAudit.result} · Auditor: ${selectedAudit.auditorName}`}
          action={<Button size="sm" variant="ghost" onClick={() => setSelectedAudit(null)}>Close</Button>}
        >
          <div className="space-y-2">
            {selectedAudit.items.map((item) => (
              <div key={item.id} className="rounded border bg-card p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold">{item.criterion}</span>
                  {item.critical && <span className="ml-2 rounded bg-red-100 text-red-800 px-1 text-[10px]">CRITICAL</span>}
                  <p className="mt-1 text-muted-foreground">Expected: {item.expected} · Actual: {item.actual}</p>
                </div>
                <div className="flex items-center gap-3">
                  {item.evidenceUrl && <AuthenticatedEvidenceImage evidenceUrl={item.evidenceUrl} />}
                  <StateBadge value={item.passed ? 'PASSED' : 'FAILED'} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Corrective Actions

export function CorrectiveActionsPage({ embedded = false }: { embedded?: boolean }) {
  const role = useAppSelector((state) => state.auth.user?.role)
  const isAuditor = role === 'QUALITY_AUDITOR'
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const loader = useCallback(
    () => brewforgeApi.quality.listCorrectiveActions({ page, size: PAGE_SIZE, status: statusFilter || undefined }),
    [page, statusFilter],
  )
  const actions = useAsyncLoad(loader, { items: [] as CorrectiveActionDto[], page: 1, size: PAGE_SIZE, total: 0 })

  const coursesLoader = useCallback(
    async () => (isAuditor ? (await brewforgeApi.courses.list({ page: 1, size: 100, state: 'PUBLISHED' })).items : []),
    [isAuditor],
  )
  const courses = useAsyncLoad<CourseDto[]>(coursesLoader, [])

  const action = useAction()
  const [selectedAction, setSelectedAction] = useState<CorrectiveActionDto | null>(null)
  const [closureNote, setClosureNote] = useState('')
  const [retrainCourseId, setRetrainCourseId] = useState('')
  const [retrainDeadline, setRetrainDeadline] = useState(addDays(14))

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Quality Corrective Actions"
          description="Track failed audit remediation, trigger mandatory re-training courses, and close corrective actions with verification notes."
        />
      )}
      <ErrorBox error={action.error ?? actions.error ?? courses.error} />
      <SuccessBox message={action.message} />

      <Panel title="Corrective Actions Pipeline">
        <Toolbar>
          <Field label="Status">
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">All</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="CLOSED">CLOSED</option>
            </Select>
          </Field>
        </Toolbar>
        <Loading show={actions.loading} />
        <DataTable
          rows={actions.data.items}
          rowKey={(ca) => ca.id}
          selectedKey={selectedAction?.id}
          onRowClick={setSelectedAction}
          columns={[
            { header: 'ID', cell: (ca) => `#${ca.id}` },
            { header: 'Branch', cell: (ca) => ca.branchCode },
            { header: 'Description', cell: (ca) => ca.description },
            { header: 'Retraining', cell: (ca) => (ca.retrainingRequired ? 'Mandatory' : 'Optional') },
            { header: 'Due Date', cell: (ca) => ca.dueDate ?? '—' },
            { header: 'Status', cell: (ca) => <StateBadge value={ca.status} /> },
            { header: 'Created', cell: (ca) => fmtDate(ca.createdAt) },
          ]}
        />
        <Pager page={page} size={PAGE_SIZE} total={actions.data.total} onPage={setPage} />
      </Panel>

      {selectedAction && (
        <Panel
          title={`Action #${selectedAction.id} - ${selectedAction.branchCode}`}
          description={`Audit #${selectedAction.branchAuditId} · Status: ${selectedAction.status}`}
          action={<Button size="sm" variant="ghost" onClick={() => setSelectedAction(null)}>Close</Button>}
        >
          <p className="text-xs mb-3">{selectedAction.description}</p>

          {selectedAction.status === 'OPEN' && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm">
              <p className="min-w-0 flex-1 text-muted-foreground">Start work on this action once the cause is understood and the staff to retrain are known.</p>
              <Button
                size="sm"
                disabled={action.busy}
                onClick={() =>
                  void action.run(
                    () => brewforgeApi.quality.startCorrectiveAction(selectedAction.id),
                    'Corrective action started.',
                    (updated) => {
                      actions.reload()
                      setSelectedAction(updated)
                    },
                  )
                }
              >
                Start action
              </Button>
            </div>
          )}

          {!isAuditor && selectedAction.status !== 'CLOSED' && (
            <p className="text-sm text-muted-foreground">Retraining is assigned and the action is closed by the Quality Auditor after a re-audit.</p>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {isAuditor && selectedAction.status !== 'CLOSED' && (
              <div className="rounded border p-3 text-xs">
                <h4 className="font-semibold mb-2">Assign Mandatory Retraining Course</h4>
                <Field label="Course">
                  <Select value={retrainCourseId} onChange={(e) => setRetrainCourseId(e.target.value)}>
                    <option value="">— select retraining course —</option>
                    {courses.data.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Completion Deadline" className="mt-2">
                  <TextInput type="date" value={retrainDeadline} onChange={(e) => setRetrainDeadline(e.target.value)} />
                </Field>
                <Button
                  size="sm"
                  className="mt-3"
                  disabled={action.busy || !retrainCourseId}
                  onClick={() =>
                    void action.run(
                      () =>
                        brewforgeApi.quality.assignRetraining(
                          selectedAction.id,
                          Number(retrainCourseId),
                          retrainDeadline,
                        ),
                      'Retraining course assigned to branch staff.',
                      () => actions.reload(),
                    )
                  }
                >
                  Assign Retraining
                </Button>
              </div>
            )}

            {isAuditor && selectedAction.status !== 'CLOSED' && (
              <div className="rounded border p-3 text-xs">
                <h4 className="font-semibold mb-2">Close Corrective Action</h4>
                <Field label="Closure Verification Note">
                  <TextInput
                    value={closureNote}
                    onChange={(e) => setClosureNote(e.target.value)}
                    placeholder="Verify remedy / re-audit results..."
                  />
                </Field>
                <Button
                  size="sm"
                  className="mt-3"
                  disabled={action.busy || !closureNote.trim()}
                  onClick={() =>
                    void action.run(
                      () => brewforgeApi.quality.closeCorrectiveAction(selectedAction.id, closureNote),
                      'Corrective action closed.',
                      () => {
                        actions.reload()
                        setSelectedAction(null)
                        setClosureNote('')
                      },
                    )
                  }
                >
                  Close Action
                </Button>
              </div>
            )}

            {selectedAction.status === 'CLOSED' && (
              <div className="rounded border bg-muted/30 p-3 text-xs col-span-2">
                <p className="font-semibold text-green-700">CLOSED at {fmtDate(selectedAction.closedAt)} by Auditor #{selectedAction.closedBy}</p>
                <p className="mt-1">Note: {selectedAction.closureNote ?? 'No note provided'}</p>
              </div>
            )}
          </div>
        </Panel>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Auditor Compliance & Trace

export function AuditorCompliancePage() {
  return (
    <>
      <PageHeader
        title="Quality Auditor Compliance & Verification"
        description="Inspect recipe version trace histories, compliance reports, and tamper-proof audit trails."
      />
      <TraceAndCompliancePanel />
    </>
  )
}
