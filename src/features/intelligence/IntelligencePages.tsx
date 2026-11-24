import { useCallback, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/components/common/PageHeader'
import { Panel } from '@/components/common/Panel'
import { Button } from '@/components/ui/button'
import { DataTable, ErrorBox, Field, Loading, Select, StateBadge } from '@/components/common/Kit'
import { useAsyncLoad } from '@/hooks/useAsyncLoad'
import { brewforgeApi } from '@/services/brewforgeApi'
import { normalizeApiError } from '@/services/apiError'
import type {
  AiModelInfoDto,
  BranchDto,
  FinanceOptimizationResultDto,
  FinanceOptimizeRequest,
  FinanceOverviewDto,
  RecipeDto,
  RecipeUnitEconomicsDto,
  SensoryProfileDto,
} from '@/types/backend'

const vndFormatter = new Intl.NumberFormat('vi-VN')

function fmtVnd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${vndFormatter.format(Math.round(value))} đ`
}

function fmtMillion(value: number): string {
  return `${(value / 1_000_000).toFixed(1)}M`
}

function tooltipVnd(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isNaN(num) ? String(value ?? '') : fmtVnd(num)
}

function QuadrantBadge({ quadrant }: { quadrant: RecipeUnitEconomicsDto['menuQuadrant'] }) {
  const styles: Record<RecipeUnitEconomicsDto['menuQuadrant'], string> = {
    STAR: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    PLOWHORSE: 'bg-sky-100 text-sky-800 border-sky-300',
    PUZZLE: 'bg-amber-100 text-amber-800 border-amber-300',
    DOG: 'bg-rose-100 text-rose-800 border-rose-300',
  }
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[quadrant]}`}>
      {quadrant}
    </span>
  )
}

/** Dark tooltip that matches the espresso theme. */
const chartTooltip = {
  contentStyle: { background: '#1f1712', border: '1px solid rgba(244,235,225,0.12)', borderRadius: 12, color: '#f4ebe1' },
  labelStyle: { color: '#a3928a' },
  itemStyle: { color: '#f4ebe1' },
  cursor: { stroke: 'rgba(244,235,225,0.15)' },
}

// ================================================================== Finance & Cashflow Page

export function FinanceIntelligencePage() {
  const [branchId, setBranchId] = useState<string>('')
  const [days, setDays] = useState<number>(45)

  const branchesLoader = useCallback(async () => (await brewforgeApi.branches.list({ page: 1, size: 50 })).items, [])
  const branches = useAsyncLoad<BranchDto[]>(branchesLoader, [])

  const modelsLoader = useCallback(() => brewforgeApi.intelligence.models(), [])
  const models = useAsyncLoad<AiModelInfoDto[]>(modelsLoader, [])

  const econLoader = useCallback(() => brewforgeApi.intelligence.unitEconomics(), [])
  const unitEcon = useAsyncLoad<RecipeUnitEconomicsDto[]>(econLoader, [])

  const overviewLoader = useCallback(
    () =>
      brewforgeApi.intelligence.financeOverview({
        branchId: branchId ? Number(branchId) : null,
        days,
      }),
    [branchId, days],
  )
  const overview = useAsyncLoad<FinanceOverviewDto | null>(overviewLoader, null)

  const [selectedRecipe, setSelectedRecipe] = useState<RecipeUnitEconomicsDto | null>(null)

  const initialOptLoader = useCallback(
    () =>
      brewforgeApi.intelligence.optimizeFinance({
        branchId: branchId ? Number(branchId) : null,
        priceChangePct: 3,
        wasteReductionTargetPct: 40,
        batchPrepFrequency: 4,
        marketingDemandLiftPct: 10,
      }),
    [branchId],
  )
  const initialOpt = useAsyncLoad<FinanceOptimizationResultDto | null>(initialOptLoader, null)

  const [optParams, setOptParams] = useState<FinanceOptimizeRequest>({
    branchId: null,
    priceChangePct: 3,
    wasteReductionTargetPct: 40,
    batchPrepFrequency: 4,
    marketingDemandLiftPct: 10,
  })
  const [customOptResult, setCustomOptResult] = useState<FinanceOptimizationResultDto | null>(null)
  const [optBusy, setOptBusy] = useState(false)
  const [optError, setOptError] = useState<string | null>(null)

  const runOptimize = useCallback(async (params: FinanceOptimizeRequest) => {
    setOptBusy(true)
    setOptError(null)
    try {
      const res = await brewforgeApi.intelligence.optimizeFinance(params)
      setCustomOptResult(res)
    } catch (err) {
      setOptError(normalizeApiError(err).message)
    } finally {
      setOptBusy(false)
    }
  }, [])

  const optResult = customOptResult ?? initialOpt.data
  const ov = overview.data
  const finModel = models.data.find((m) => m.modelId === 'BrewForge-FinOpt-v2.1')

  return (
    <>
      <PageHeader
        title="Finance & Cashflow"
        description="Dòng tiền các chi nhánh, giá vốn theo công thức, dự báo hao hụt nguyên liệu và mô phỏng lợi nhuận."
      />
      <ErrorBox error={overview.error ?? unitEcon.error ?? models.error ?? initialOpt.error ?? optError} />

      <Panel title="Phạm vi và chu kỳ phân tích">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Chi nhánh">
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">Toàn chuỗi (All Branches)</option>
              {branches.data.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branchCode} · {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Chu kỳ dữ liệu lịch sử">
            <Select value={String(days)} onChange={(e) => setDays(Number(e.target.value))}>
              <option value="14">14 ngày gần nhất</option>
              <option value="30">30 ngày gần nhất</option>
              <option value="45">45 ngày gần nhất</option>
              <option value="90">90 ngày gần nhất</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                overview.reload()
                unitEcon.reload()
                void runOptimize({ ...optParams, branchId: branchId ? Number(branchId) : null })
              }}
            >
              Làm mới dữ liệu ML
            </Button>
          </div>
        </div>
      </Panel>

      <Loading show={overview.loading} />

      {ov && (
        <>
          {/* KPI Summary */}
          <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiBox label={`Doanh thu (${ov.historicalDays}d)`} value={fmtVnd(ov.grossRevenueVnd)} sub={`${ov.totalCupsSold.toLocaleString('vi-VN')} ly bán ra`} />
            <KpiBox label="Giá vốn BOM (COGS)" value={fmtVnd(ov.totalCogsVnd)} sub="Nguyên liệu + ly/bao bì" />
            <KpiBox
              label="Hao hụt nguyên liệu (Waste)"
              value={fmtVnd(ov.spoilageWasteCostVnd)}
              sub={`Tỷ lệ hủy ${ov.spoilageRatePct}%`}
              accent="text-amber-700"
            />
            <KpiBox
              label="Lợi nhuận gộp"
              value={fmtVnd(ov.grossProfitVnd)}
              sub={`Biên gộp ${ov.grossMarginPct}%`}
              accent="text-emerald-700"
            />
            <KpiBox
              label="Dòng tiền ròng lịch sử"
              value={fmtVnd(ov.netCashflowVnd)}
              sub={`Hòa vốn: ${ov.breakEvenDailyCups} ly/ngày`}
              accent={ov.netCashflowVnd >= 0 ? 'text-emerald-700' : 'text-rose-700'}
            />
            <KpiBox
              label="Dự báo ròng 30 ngày tới"
              value={fmtVnd(ov.forecast30DayNetCashflowVnd)}
              sub={`Health: ${ov.cashflowHealthScore}/100 · R²=${ov.modelCashflowR2}`}
              accent="text-primary"
            />
          </div>

          {/* Historical + Forecast Chart */}
          <Panel
            title="Dòng tiền thực tế và dự báo 30 ngày"
            description="Đường Inflow (doanh thu), Outflow (COGS + hao hụt + vận hành) và Dòng tiền ròng hàng ngày kết hợp dự báo 30 ngày từ BrewForge-FinOpt-v2.1."
          >
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={ov.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,235,225,0.08)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a3928a' }} minTickGap={18} />
                  <YAxis tickFormatter={fmtMillion} tick={{ fontSize: 11, fill: '#a3928a' }} />
                  <Tooltip formatter={tooltipVnd} {...chartTooltip} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cashInflowVnd"
                    name="Cash Inflow (Doanh thu)"
                    fill="#f2d58e"
                    fillOpacity={0.14}
                    stroke="#f2d58e"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="cogsOutflowVnd"
                    name="COGS Outflow (Giá vốn)"
                    fill="#a9c8e8"
                    fillOpacity={0.12}
                    stroke="#a9c8e8"
                    strokeWidth={1.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="netCashflowVnd"
                    name="Net Cashflow (Dòng tiền ròng)"
                    stroke="#a8d8a6"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </>
      )}

      {/* Interactive Cashflow What-If Optimizer */}
      <Panel
        title="Mô phỏng và tối ưu dòng tiền, chi phí"
        description="Điều chỉnh chính sách giá bán, mục tiêu giảm hủy hàng, số mẻ sơ chế theo ngày và tăng trưởng lưu lượng để xem tác động ngay lên dòng tiền 30 ngày tới."
      >
        <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 md:grid-cols-5">
          <SliderControl
            label="Điều chỉnh giá bán (%)"
            value={optParams.priceChangePct}
            min={-10}
            max={15}
            step={1}
            unit="%"
            onChange={(v) => setOptParams((p) => ({ ...p, priceChangePct: v }))}
          />
          <SliderControl
            label="Mục tiêu giảm hao hụt (%)"
            value={optParams.wasteReductionTargetPct}
            min={0}
            max={70}
            step={5}
            unit="%"
            onChange={(v) => setOptParams((p) => ({ ...p, wasteReductionTargetPct: v }))}
          />
          <SliderControl
            label="Số mẻ sơ chế/ngày"
            value={optParams.batchPrepFrequency}
            min={1}
            max={6}
            step={1}
            unit=" mẻ"
            onChange={(v) => setOptParams((p) => ({ ...p, batchPrepFrequency: v }))}
          />
          <SliderControl
            label="Tăng trưởng lượng khách (%)"
            value={optParams.marketingDemandLiftPct}
            min={-5}
            max={30}
            step={1}
            unit="%"
            onChange={(v) => setOptParams((p) => ({ ...p, marketingDemandLiftPct: v }))}
          />
          <div className="flex items-end">
            <Button
              size="sm"
              className="w-full"
              disabled={optBusy}
              onClick={() => void runOptimize({ ...optParams, branchId: branchId ? Number(branchId) : null })}
            >
              {optBusy ? 'Đang tính toán...' : 'Chạy tối ưu hóa'}
            </Button>
          </div>
        </div>

        {optResult && (
          <div className="mt-5 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiBox
                label="Baseline Dòng tiền 30d"
                value={fmtVnd(optResult.baseline30DayNetCashflowVnd)}
                sub={`Hao hụt nền: ${optResult.baselineSpoilagePct}%`}
              />
              <KpiBox
                label="Optimized Dòng tiền 30d"
                value={fmtVnd(optResult.optimized30DayNetCashflowVnd)}
                sub={`Hao hụt tối ưu: ${optResult.optimizedSpoilagePct}%`}
                accent="text-emerald-700"
              />
              <KpiBox
                label="Tăng trưởng dòng tiền ròng"
                value={`${optResult.netCashflowGain30DayVnd >= 0 ? '+' : ''}${fmtVnd(optResult.netCashflowGain30DayVnd)}`}
                sub={`Cải thiện ${optResult.cashflowImprovementPct >= 0 ? '+' : ''}${optResult.cashflowImprovementPct}%`}
                accent="text-primary"
              />
              <KpiBox
                label="Co giãn cầu dự báo"
                value={`${optResult.expectedDemandChangePct >= 0 ? '+' : ''}${optResult.expectedDemandChangePct}%`}
                sub={`Độ tin cậy R² = ${optResult.confidenceR2}`}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border p-4">
                <h3 className="mb-3 text-sm font-semibold">Lũy kế dòng tiền 30 ngày: hiện tại và tối ưu</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={optResult.forecastComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,235,225,0.08)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a3928a' }} minTickGap={15} />
                      <YAxis tickFormatter={fmtMillion} tick={{ fontSize: 10, fill: '#a3928a' }} />
                      <Tooltip formatter={tooltipVnd} {...chartTooltip} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="baselineCumulativeVnd"
                        name="Baseline Lũy Kế"
                        stroke="#a9c8e8"
                        fill="#a9c8e8"
                        fillOpacity={0.2}
                      />
                      <Area
                        type="monotone"
                        dataKey="optimizedCumulativeVnd"
                        name="Optimized Lũy Kế (AI)"
                        stroke="#a8d8a6"
                        fill="#a8d8a6"
                        fillOpacity={0.25}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <h3 className="mb-3 text-sm font-semibold">Đề xuất hành động</h3>
                <div className="space-y-2.5">
                  {optResult.recommendations.map((rec, idx) => (
                    <div key={idx} className="rounded-lg border bg-card p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">{rec.title}</span>
                        <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                          +{fmtVnd(rec.estimatedMonthlyGainVnd)}/tháng
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">{rec.impactDescription}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Lịch chia mẻ sơ chế theo hạn sử dụng (≤ 12 giờ)</h3>
              <DataTable
                rows={optResult.batchPrepPlan}
                rowKey={(item) => item.ingredientCode}
                columns={[
                  { header: 'Mã NL', cell: (x) => <span className="font-mono text-xs">{x.ingredientCode}</span> },
                  { header: 'Tên nguyên liệu', cell: (x) => x.ingredientName },
                  { header: 'HSD', cell: (x) => `${x.shelfLifeHours}h` },
                  { header: 'Rủi ro hủy', cell: (x) => <StateBadge value={x.spoilageRisk} /> },
                  { header: 'Tần suất tối ưu', cell: (x) => x.prepCadence },
                  { header: 'Tiết kiệm ước tính', cell: (x) => <strong className="text-emerald-700">{fmtVnd(x.estimatedMonthlySavingsVnd)}/tháng</strong> },
                ]}
              />
            </div>
          </div>
        )}
      </Panel>

      {/* Unit Economics & BOM Breakdown */}
      <Panel
        title="Giá vốn và hiệu quả từng món"
        description="Bấm vào một dòng thức uống để xem bóc tách chi phí chi tiết đến từng gram/ml nguyên liệu, bao bì, nhân công theo giây và đề xuất giá bán tối ưu."
      >
        <Loading show={unitEcon.loading} />
        <DataTable
          rows={unitEcon.data}
          rowKey={(r) => r.recipeId}
          selectedKey={selectedRecipe?.recipeId}
          onRowClick={setSelectedRecipe}
          columns={[
            { header: 'Mã', cell: (r) => <span className="font-mono font-semibold">{r.recipeCode}</span> },
            { header: 'Tên thức uống', cell: (r) => r.name },
            { header: 'Nguyên liệu', cell: (r) => fmtVnd(r.ingredientCostVnd) },
            { header: 'Nhân công', cell: (r) => `${fmtVnd(r.laborCostVnd)} (${r.activePrepSeconds}s)` },
            { header: 'Giá vốn / ly (COGS)', cell: (r) => <strong>{fmtVnd(r.unitCogsVnd)}</strong> },
            { header: 'Giá bán', cell: (r) => fmtVnd(r.currentPriceVnd) },
            { header: 'Giá tối ưu AI', cell: (r) => <span className="font-semibold text-primary">{fmtVnd(r.optimalPriceVnd)}</span> },
            { header: 'Biên gộp', cell: (r) => `${r.grossMarginPct}%` },
            { header: 'Lợi nhuận 30d', cell: (r) => <strong className="text-emerald-700">{fmtVnd(r.monthlyContributionProfitVnd)}</strong> },
            { header: 'Phân loại', cell: (r) => <QuadrantBadge quadrant={r.menuQuadrant} /> },
          ]}
        />

        {selectedRecipe && (
          <div className="mt-5 rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold">
                  Chi tiết Định mức BOM: {selectedRecipe.recipeCode} · {selectedRecipe.name} (v{selectedRecipe.releasedVersionNo ?? '—'})
                </h4>
                <p className="text-xs text-muted-foreground">
                  Tổng giá vốn: {fmtVnd(selectedRecipe.unitCogsVnd)} (NL: {fmtVnd(selectedRecipe.ingredientCostVnd)} + Bao bì: {fmtVnd(selectedRecipe.packagingCostVnd)} + Điện/Máy: {fmtVnd(selectedRecipe.utilityCostVnd)} + Nhân công: {fmtVnd(selectedRecipe.laborCostVnd)} + Dự phòng hủy: {fmtVnd(selectedRecipe.estimatedWasteAllowanceVnd)})
                </p>
              </div>
              <QuadrantBadge quadrant={selectedRecipe.menuQuadrant} />
            </div>
            <DataTable
              rows={selectedRecipe.bomBreakdown}
              rowKey={(b) => b.ingredientCode}
              columns={[
                { header: 'Mã NL', cell: (b) => <span className="font-mono text-xs">{b.ingredientCode}</span> },
                { header: 'Nguyên liệu', cell: (b) => b.name },
                { header: 'Định lượng', cell: (b) => `${b.quantity} ${b.unit}` },
                { header: 'Đơn giá', cell: (b) => `${fmtVnd(b.unitCostVnd)} / ${b.unit}` },
                { header: 'Thành tiền', cell: (b) => <strong>{fmtVnd(b.lineCostVnd)}</strong> },
                { header: 'HSD', cell: (b) => `${b.shelfLifeHours}h` },
                { header: 'Rủi ro hao hụt', cell: (b) => <StateBadge value={b.spoilageRisk} /> },
              ]}
            />
          </div>
        )}
      </Panel>

      {/* Branch Financial Table + ML Model Card */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Dòng tiền theo chi nhánh">
          <DataTable
            rows={ov?.branches ?? []}
            rowKey={(b) => b.branchId}
            columns={[
              { header: 'Chi nhánh', cell: (b) => `${b.branchCode} · ${b.branchName}` },
              { header: 'Sản lượng', cell: (b) => b.totalCupsSold.toLocaleString('vi-VN') },
              { header: 'Doanh thu', cell: (b) => fmtVnd(b.grossRevenueVnd) },
              { header: 'Hao hụt', cell: (b) => `${b.predictedSpoilagePct}%` },
              { header: 'Ròng (Net)', cell: (b) => <strong className={b.netCashflowVnd >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{fmtVnd(b.netCashflowVnd)}</strong> },
              { header: 'Biên gộp', cell: (b) => `${b.grossMarginPct}%` },
            ]}
          />
        </Panel>

        <Panel
          title="Thông số mô hình dự báo"
          description="Trọng số huấn luyện thực tế được sinh từ 3.240 bản ghi vận hành chuỗi F&B và đồng bộ trực tiếp vào Backend."
        >
          {finModel && (
            <div className="space-y-3 text-xs">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p><strong>Model ID:</strong> {finModel.modelId} (v{finModel.version})</p>
                <p><strong>Thuật toán:</strong> {finModel.algorithm}</p>
                <p><strong>Dữ liệu Train / Test:</strong> {finModel.trainingSamples.toLocaleString('vi-VN')} / {finModel.testSamples.toLocaleString('vi-VN')} mẫu</p>
                <p className="mt-1 font-mono text-[11px] text-primary">
                  python3 ml/generate_dataset.py &amp;&amp; python3 ml/train_cost_cashflow_model.py
                </p>
              </div>
              <div className="space-y-2">
                {finModel.metrics.map((m) => (
                  <div key={m.headName} className="rounded-lg border p-2.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span>{m.headName}</span>
                      <span className="text-emerald-700">Test R² = {m.testR2} · MAPE = {m.testMapePct}%</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      {Object.entries(m.featureImportance).slice(0, 4).map(([feat, imp]) => (
                        <span key={feat} className="rounded border bg-background px-1.5 py-0.5">
                          {feat}: {(imp * 100).toFixed(1)}%
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </>
  )
}

// ================================================================== Sensory Digital Twin Page

export function SensoryTwinPage() {
  const recipesLoader = useCallback(async () => {
    const res = await brewforgeApi.recipes.list({ page: 1, size: 100, status: 'ACTIVE' })
    return res.items.filter((r) => r.recipeCode !== 'R99')
  }, [])
  const recipes = useAsyncLoad<RecipeDto[]>(recipesLoader, [])

  const [recipeId, setRecipeId] = useState<string>('')
  const effectiveRecipeId = recipeId || (recipes.data[0] ? String(recipes.data[0].id) : '')

  const [waterTempC, setWaterTempC] = useState<number>(90)
  const [extractionSeconds, setExtractionSeconds] = useState<number>(300)
  const [iceRatioPct, setIceRatioPct] = useState<number>(100)
  const [sugarLevelPct, setSugarLevelPct] = useState<number>(100)
  const [milkSteamTempC, setMilkSteamTempC] = useState<number>(62)

  const initialProfileLoader = useCallback(async () => {
    if (!effectiveRecipeId) return null
    return brewforgeApi.intelligence.analyzeSensory({ recipeId: Number(effectiveRecipeId) })
  }, [effectiveRecipeId])
  const initialProfile = useAsyncLoad<SensoryProfileDto | null>(initialProfileLoader, null)

  const [customProfile, setCustomProfile] = useState<SensoryProfileDto | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = useCallback(
    async (rid: number, overrides?: Partial<{ waterTempC: number; extractionSeconds: number; iceRatioPct: number; sugarLevelPct: number; milkSteamTempC: number }>) => {
      setBusy(true)
      setError(null)
      try {
        const res = await brewforgeApi.intelligence.analyzeSensory({
          recipeId: rid,
          ...overrides,
        })
        setCustomProfile(res)
      } catch (err) {
        setError(normalizeApiError(err).message)
      } finally {
        setBusy(false)
      }
    },
    [],
  )

  const handleRecipeChange = (nextId: string) => {
    setRecipeId(nextId)
    setCustomProfile(null)
    if (nextId) {
      void analyze(Number(nextId))
    }
  }

  const profile = customProfile ?? initialProfile.data

  const radarData = profile
    ? [
        { axis: 'Hương thơm', score: profile.axes.aroma },
        { axis: 'Độ đậm (Body)', score: profile.axes.body },
        { axis: 'Độ ngọt', score: profile.axes.sweetness },
        { axis: 'Độ đắng/Hậu vị', score: profile.axes.bitterness },
        { axis: 'Độ béo', score: profile.axes.creaminess },
        { axis: 'Tươi mát', score: profile.axes.refreshment },
        { axis: 'Độ bền bọt', score: profile.axes.foamStability },
        { axis: 'Hài hòa tổng thể', score: profile.axes.overallHarmony },
      ]
    : []

  return (
    <>
      <PageHeader
        title="Sensory & Extraction Lab"
        description="Mô phỏng hồ sơ cảm quan 8 trục, chỉ số hóa lý (Brix, Caffeine, Calories) và chẩn đoán lỗi thao tác Barista khi thay đổi thông số nhiệt độ/chiết xuất."
      />
      <ErrorBox error={recipes.error ?? initialProfile.error ?? error} />

      <Panel title="Thông số mô phỏng pha chế">
        <div className="grid gap-4 md:grid-cols-6">
          <Field label="Công thức thử nghiệm" className="md:col-span-2">
            <Select value={effectiveRecipeId} onChange={(e) => handleRecipeChange(e.target.value)}>
              {recipes.data.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.recipeCode} · {r.name} ({r.category})
                </option>
              ))}
            </Select>
          </Field>
          <SliderControl label="Nhiệt độ nước (°C)" value={waterTempC} min={65} max={100} step={1} unit="°C" onChange={setWaterTempC} />
          <SliderControl label="Chiết xuất / Ủ (giây)" value={extractionSeconds} min={15} max={500} step={5} unit="s" onChange={setExtractionSeconds} />
          <SliderControl label="Lượng đá / Đường (%)" value={sugarLevelPct} min={20} max={130} step={5} unit="% đường" onChange={setSugarLevelPct} />
          <SliderControl label="Đánh sữa nóng (°C)" value={milkSteamTempC} min={5} max={80} step={1} unit="°C" onChange={setMilkSteamTempC} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="w-56">
            <SliderControl label="Tỷ lệ đá (%)" value={iceRatioPct} min={0} max={130} step={10} unit="%" onChange={setIceRatioPct} />
          </div>
          <Button
            size="sm"
            className="mt-4"
            disabled={busy || !effectiveRecipeId}
            onClick={() =>
              void analyze(Number(effectiveRecipeId), {
                waterTempC,
                extractionSeconds,
                iceRatioPct,
                sugarLevelPct,
                milkSteamTempC,
              })
            }
          >
            {busy ? 'Đang phân tích...' : 'Phân tích cảm quan'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            disabled={busy || !effectiveRecipeId}
            onClick={() => void analyze(Number(effectiveRecipeId))}
          >
            Khôi phục thông số chuẩn SOP
          </Button>
        </div>
      </Panel>

      {profile && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            title={`Hồ sơ cảm quan: ${profile.recipeCode} · ${profile.recipeName}`}
            description={`Điểm hài hòa tổng thể: ${profile.axes.overallHarmony}/100`}
          >
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(244,235,225,0.12)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#a3928a' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#a3928a' }} />
                  <Radar
                    name={profile.recipeName}
                    dataKey="score"
                    stroke="#d8b48f"
                    fill="#d8b48f"
                    fillOpacity={0.45}
                  />
                  <Tooltip {...chartTooltip} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            title="Thông số hóa lý, dinh dưỡng và chẩn đoán"
            description={`Giá vốn ước tính: ${fmtVnd(profile.estimatedCogsVnd)} · Giá bán tối ưu: ${fmtVnd(profile.recommendedPriceVnd)} (Biên gộp ${profile.grossMarginPct}%)`}
          >
            <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <MiniMetric label="Thể tích" value={`${profile.physics.servingVolumeMl} ml`} />
              <MiniMetric label="Nhiệt độ phục vụ" value={`${profile.physics.servingTempC} °C`} />
              <MiniMetric label="Độ ngọt Brix" value={`${profile.physics.brixLevel} °Bx`} />
              <MiniMetric label="Caffeine" value={`${profile.physics.caffeineMg} mg`} />
              <MiniMetric label="Calories" value={`${profile.physics.caloriesKcal} kcal`} />
              <MiniMetric label="Độ tan đá" value={`${profile.physics.dilutionPct}%`} />
              <MiniMetric label="Thao tác quầy" value={`${profile.physics.activePrepSeconds} s`} />
              <MiniMetric label="HSD tươi" value={`${Math.round(profile.physics.shelfLifeWindowMinutes / 60)} giờ`} />
            </div>

            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Chẩn đoán lỗi pha chế và cảnh báo chất lượng
            </h4>
            <div className="space-y-2">
              {profile.diagnostics.map((d, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 text-xs ${
                    d.severity === 'HIGH'
                      ? 'border-rose-300 bg-rose-50/70 text-rose-950'
                      : d.severity === 'MEDIUM'
                        ? 'border-amber-300 bg-amber-50/70 text-amber-950'
                        : d.severity === 'OK'
                          ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950'
                          : 'bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>[{d.code}] {d.parameter}</span>
                    <span>{d.severity}</span>
                  </div>
                  <p className="mt-1">{d.message}</p>
                  <p className="mt-1 font-medium">Khuyến nghị: {d.recommendation}</p>
                </div>
              ))}
            </div>

            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {profile.optimizationHints.map((hint, idx) => (
                <li key={idx}>• {hint}</li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </>
  )
}

// ================================================================== Helpers

function KpiBox({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div className="surface rounded-2xl border p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-xl font-bold tracking-tight ${accent ?? 'text-foreground'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-2 text-center">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  )
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (val: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono font-semibold text-primary">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary cursor-pointer"
      />
    </div>
  )
}
