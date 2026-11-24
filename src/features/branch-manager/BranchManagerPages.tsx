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
  fmtDate,
  today,
  useAction,
} from '@/components/common/Kit'
import { useAsyncLoad } from '@/hooks/useAsyncLoad'
import { brewforgeApi } from '@/services/brewforgeApi'
import { BranchAuditsPage, CorrectiveActionsPage } from '@/features/quality-auditor/QualityAuditorPages'
import type {
  BranchLaunchStatusDto,
  EmployeeSkillSummaryDto,
  PosImportResultDto,
  SalesRecordDto,
  SellableDrinkDto,
  TrainingProgressRowDto,
} from '@/types/backend'

const PAGE_SIZE = 20

// ------------------------------------------------------------------ Staff Readiness

export function BranchStaffReadinessPage() {
  const employeesLoader = useCallback(() => brewforgeApi.dashboards.employees(), [])
  const employees = useAsyncLoad(employeesLoader, [] as EmployeeSkillSummaryDto[])

  const progressLoader = useCallback(() => brewforgeApi.dashboards.trainingProgress(), [])
  const progress = useAsyncLoad(progressLoader, [] as TrainingProgressRowDto[])

  return (
    <>
      <PageHeader
        title="Branch Team Readiness"
        description="Monitor branch staff certification status, required skill matrix coverage, and pending/overdue training courses."
      />
      <ErrorBox error={employees.error ?? progress.error} />

      <Panel title="Branch Employee Skill Passports">
        <Loading show={employees.loading} />
        <DataTable
          rows={employees.data}
          rowKey={(e) => e.userId}
          empty="No employee records found for your branch scope."
          columns={[
            { header: 'Employee', cell: (e) => e.fullName },
            { header: 'Branch', cell: (e) => e.branchCode ?? 'HQ' },
            { header: 'Certified Skills', cell: (e) => `${e.certifiedSkills} / ${e.requiredSkills}` },
            { header: 'In Training', cell: (e) => e.inTraining },
            { header: 'Overdue', cell: (e) => (e.overdue > 0 ? <span className="font-bold text-destructive">{e.overdue} overdue</span> : '0') },
            { header: 'Readiness Status', cell: (e) => <StateBadge value={e.status} /> },
          ]}
        />
      </Panel>

      <Panel title="Branch Course Progress Overview">
        <Loading show={progress.loading} />
        <DataTable
          rows={progress.data}
          rowKey={(p) => `${p.branchId}-${p.courseId}`}
          empty="No course progress records."
          columns={[
            { header: 'Course', cell: (p) => p.courseTitle },
            { header: 'Assigned', cell: (p) => p.assigned },
            { header: 'In Progress', cell: (p) => p.inProgress },
            { header: 'Eligible for Quiz', cell: (p) => p.eligible },
            { header: 'Passed Theory', cell: (p) => p.passed },
            { header: 'Valid Certificates', cell: (p) => <span className="font-semibold text-green-700">{p.certifiedValid}</span> },
            { header: 'Needs Recertification', cell: (p) => (p.needsRecertification > 0 ? <span className="text-amber-800">{p.needsRecertification}</span> : '0') },
          ]}
        />
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------ Launches

export function BranchLaunchesPage() {
  const launchesLoader = useCallback(() => brewforgeApi.pilots.listBranchLaunchStatus(), [])
  const launches = useAsyncLoad(launchesLoader, [] as BranchLaunchStatusDto[])

  return (
    <>
      <PageHeader
        title="Drink Launches & Branch Pilot Status"
        description="Track menu launches at your branch, certified barista coverage gates, and live dates."
      />
      <ErrorBox error={launches.error} />

      <Panel title="Branch Launch Status Registry">
        <Loading show={launches.loading} />
        <DataTable
          rows={launches.data}
          rowKey={(l) => l.id}
          empty="No launch items tracked."
          columns={[
            { header: 'Drink', cell: (l) => `${l.recipeCode} · ${l.recipeName}` },
            { header: 'Version', cell: (l) => (l.versionNo ? `v${l.versionNo}` : '—') },
            { header: 'Origin', cell: (l) => l.origin ?? '—' },
            { header: 'Launch Status', cell: (l) => <StateBadge value={l.status} /> },
            { header: 'Certified Baristas', cell: (l) => `${l.certifiedCount} / ${l.minCertifiedStaff}` },
            { header: 'Coverage Met', cell: (l) => (l.coverageMet ? <span className="text-green-700 font-semibold">MET</span> : <span className="text-destructive font-semibold">SHORTFALL ({l.shortfall})</span>) },
            { header: 'Live Since', cell: (l) => fmtDate(l.liveSince) },
          ]}
        />
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------ Sales & POS Import

export function BranchSalesPage() {
  const { user } = useAppSelector((s) => s.auth)
  const [page, setPage] = useState(1)
  const loader = useCallback(() => brewforgeApi.sales.list({ page, size: PAGE_SIZE }), [page])
  const sales = useAsyncLoad(loader, { items: [] as SalesRecordDto[], page: 1, size: PAGE_SIZE, total: 0 })

  const drinksLoader = useCallback(() => brewforgeApi.sales.sellableDrinks(), [])
  const drinks = useAsyncLoad(drinksLoader, [] as SellableDrinkDto[])

  const action = useAction()

  // Manual record form
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [tradingDate, setTradingDate] = useState(today())
  const [cupsSold, setCupsSold] = useState('')

  // Correction form
  const [editingSale, setEditingSale] = useState<SalesRecordDto | null>(null)
  const [correctionCount, setCorrectionCount] = useState('')

  // POS Import
  const [posFile, setPosFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<PosImportResultDto | null>(null)

  const handleManualSale = () => {
    const callerBranchId = user?.numericBranchId ?? (user?.branchId ? Number(user.branchId) : 0)
    void action.run(
      () =>
        brewforgeApi.sales.create({
          branchId: callerBranchId,
          recipeId: Number(selectedRecipeId),
          tradingDate,
          cupsSold: Number(cupsSold),
        }),
      'Daily sales count recorded.',
      () => {
        sales.reload()
        setCupsSold('')
      },
    )
  }

  const handleCorrectSale = () => {
    if (!editingSale) return
    void action.run(
      () => brewforgeApi.sales.correct(editingSale.id, Number(correctionCount)),
      `Sales record #${editingSale.id} corrected.`,
      () => {
        sales.reload()
        setEditingSale(null)
      },
    )
  }

  const handleImportPos = () => {
    if (!posFile) return
    void action.run(
      () => brewforgeApi.sales.importPos(posFile),
      (res) => `POS Import complete! ${res.accepted} accepted, ${res.rejected} rejected, ${res.replaced} replaced.`,
      (res) => {
        setImportResult(res)
        setPosFile(null)
        sales.reload()
      },
    )
  }

  return (
    <>
      <PageHeader
        title="Branch Sales & POS Import"
        description="Record daily drink sales for live drinks, correct sales counts, or upload automated POS export CSV/XLSX files."
      />
      <ErrorBox error={action.error ?? sales.error ?? drinks.error} />
      <SuccessBox message={action.message} />

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Record Daily Drink Sales (Manual)">
          <div className="space-y-3">
            <Field label="Sellable Drink (Coverage Met Required - BR-24)">
              <Select value={selectedRecipeId} onChange={(e) => setSelectedRecipeId(e.target.value)}>
                <option value="">— select drink —</option>
                {drinks.data.map((d) => (
                  <option key={d.recipeId} value={d.recipeId} disabled={!d.coverageMet}>
                    {d.recipeCode} · {d.name} {d.coverageMet ? '' : '(Coverage Not Met)'}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Trading Date">
                <TextInput type="date" value={tradingDate} onChange={(e) => setTradingDate(e.target.value)} />
              </Field>
              <Field label="Cups Sold">
                <TextInput type="number" value={cupsSold} onChange={(e) => setCupsSold(e.target.value)} placeholder="e.g. 142" />
              </Field>
            </div>
            <Button
              size="sm"
              disabled={action.busy || !selectedRecipeId || !cupsSold}
              onClick={handleManualSale}
            >
              Record Daily Sales
            </Button>
          </div>
        </Panel>

        <Panel title="Automated POS Import (CSV / XLSX)">
          <p className="text-xs text-muted-foreground mb-3">
            Expected headers: <code>branch_code, drink_code, trading_date, quantity</code> (Sample in <code>samples/pos-import-sample.csv</code>).
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" accept=".csv,.xlsx" onChange={(e) => setPosFile(e.target.files?.[0] ?? null)} className="text-xs" />
            <Button size="sm" disabled={action.busy || !posFile} onClick={handleImportPos}>
              Import File
            </Button>
          </div>

          {importResult && (
            <div className="mt-4 rounded border bg-muted/40 p-3 text-xs">
              <p className="font-semibold">Import Result: Job {importResult.jobId}</p>
              <p className="mt-1">
                Accepted: <strong>{importResult.accepted}</strong> · Rejected: <strong>{importResult.rejected}</strong> · Replaced: <strong>{importResult.replaced}</strong>
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-2 text-destructive">
                  <p className="font-semibold">Errors ({importResult.errors.length}):</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>Row {err.row}: [{err.code}] {err.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Sales Journal">
        <Loading show={sales.loading} />
        <DataTable
          rows={sales.data.items}
          rowKey={(s) => s.id}
          columns={[
            { header: 'ID', cell: (s) => `#${s.id}` },
            { header: 'Date', cell: (s) => s.tradingDate },
            { header: 'Drink', cell: (s) => `${s.recipeCode} · ${s.recipeName}` },
            { header: 'Version', cell: (s) => (s.versionNo ? `v${s.versionNo}` : '—') },
            { header: 'Cups Sold', cell: (s) => <span className="font-bold">{s.cupsSold}</span> },
            { header: 'Source', cell: (s) => s.source },
            { header: 'Recorded', cell: (s) => fmtDate(s.recordedAt) },
            {
              header: 'Action',
              cell: (s) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingSale(s)
                    setCorrectionCount(String(s.cupsSold))
                  }}
                >
                  Correct Count
                </Button>
              ),
            },
          ]}
        />
        <Pager page={page} size={PAGE_SIZE} total={sales.data.total} onPage={setPage} />
      </Panel>

      {editingSale && (
        <Panel
          title={`Correct Sales: #${editingSale.id} · ${editingSale.recipeCode} (${editingSale.tradingDate})`}
          action={<Button size="sm" variant="ghost" onClick={() => setEditingSale(null)}>Cancel</Button>}
        >
          <div className="flex items-end gap-3 max-w-sm">
            <Field label="Corrected Cups Sold">
              <TextInput type="number" value={correctionCount} onChange={(e) => setCorrectionCount(e.target.value)} />
            </Field>
            <Button size="sm" disabled={action.busy} onClick={handleCorrectSale}>
              Save Correction
            </Button>
          </div>
        </Panel>
      )}
    </>
  )
}

// ------------------------------------------------------------------ Quality

export function BranchQualityPage() {
  return (
    <>
      <PageHeader
        title="Branch Quality & Audits"
        description="Inspect branch quality audit results and manage corrective action follow-ups."
      />
      <BranchAuditsPage embedded />
      <CorrectiveActionsPage embedded />
    </>
  )
}
