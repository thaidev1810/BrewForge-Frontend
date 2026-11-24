import { useCallback, useState } from 'react'
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
  useAction,
} from '@/components/common/Kit'
import { useAsyncLoad } from '@/hooks/useAsyncLoad'
import { brewforgeApi } from '@/services/brewforgeApi'
import type { CategoryDto, ProductDto, RecipeCategory, RecipeDto, RecipeOrigin } from '@/types/backend'
import { RecipeVersionStudio, StepEditor, rowsToSteps, ValidationView } from './RecipeStudio'

const PAGE_SIZE = 20
const CATEGORIES: RecipeCategory[] = ['TEA', 'COFFEE', 'OTHER']

// ------------------------------------------------------------------ products

export function ProductsPage({ readOnly = false }: { readOnly?: boolean }) {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const loader = useCallback(() => brewforgeApi.products.list({ page, size: PAGE_SIZE, q: q || undefined }), [page, q])
  const products = useAsyncLoad(loader, { items: [] as ProductDto[], page: 1, size: PAGE_SIZE, total: 0 })
  const lookupLoader = useCallback(async () => {
    if (readOnly) return { categories: [] as CategoryDto[], recipes: [] as RecipeDto[] }
    const [c, r] = await Promise.all([
      brewforgeApi.categories.list({ page: 1, size: 100, kind: 'DRINK', status: 'ACTIVE' }),
      brewforgeApi.recipes.list({ page: 1, size: 100 }),
    ])
    return { categories: c.items, recipes: r.items }
  }, [readOnly])
  const lookups = useAsyncLoad(lookupLoader, { categories: [] as CategoryDto[], recipes: [] as RecipeDto[] })
  const action = useAction()
  const empty = { productCode: '', name: '', categoryId: '', recipeId: '', description: '', imageUrl: '' }
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<ProductDto | null>(null)

  const body = () => ({
    productCode: form.productCode,
    name: form.name,
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    recipeId: form.recipeId ? Number(form.recipeId) : null,
    description: form.description || null,
    imageUrl: form.imageUrl || null,
  })

  return (
    <>
      <PageHeader title="Products" description="Drink catalog. A product shows the released version of its recipe." />
      <ErrorBox error={action.error ?? products.error ?? lookups.error} />
      <SuccessBox message={action.message} />
      {!readOnly && (
        <Panel title={editing ? `Edit ${editing.productCode}` : 'Create product'}>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Code"><TextInput value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })} /></Field>
            <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Drink category">
              <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">—</option>
                {lookups.data.categories.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
              </Select>
            </Field>
            <Field label="Recipe">
              <Select value={form.recipeId} onChange={(e) => setForm({ ...form, recipeId: e.target.value })}>
                <option value="">—</option>
                {lookups.data.recipes.map((r) => <option key={r.id} value={r.id}>{r.recipeCode} · {r.name}</option>)}
              </Select>
            </Field>
            <Field label="Description"><TextInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Image URL"><TextInput value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={action.busy}
              onClick={() =>
                void action.run(
                  () => (editing ? brewforgeApi.products.update(editing.id, { ...body(), status: editing.status }) : brewforgeApi.products.create(body())),
                  editing ? 'Product updated.' : 'Product created.',
                  () => { setEditing(null); setForm(empty); products.reload() },
                )
              }
            >
              {editing ? 'Save' : 'Create'}
            </Button>
            {editing && <Button size="sm" variant="outline" onClick={() => { setEditing(null); setForm(empty) }}>Cancel</Button>}
          </div>
        </Panel>
      )}
      <Panel title="Catalog">
        <Toolbar>
          <Field label="Search"><TextInput value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} /></Field>
        </Toolbar>
        <Loading show={products.loading} />
        <DataTable
          rows={products.data.items}
          rowKey={(p) => p.id}
          columns={[
            { header: 'Code', cell: (p) => p.productCode },
            { header: 'Name', cell: (p) => p.name },
            { header: 'Category', cell: (p) => p.categoryName ?? '—' },
            { header: 'Recipe', cell: (p) => (p.recipeCode ? `${p.recipeCode} v${p.currentVersionNo ?? '—'}` : '—') },
            { header: 'Description', cell: (p) => p.description ?? '—' },
            { header: 'Status', cell: (p) => <StateBadge value={p.status} /> },
            ...(readOnly
              ? []
              : [
                {
                  header: 'Actions',
                  cell: (p: ProductDto) => (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setEditing(p); setForm({ productCode: p.productCode, name: p.name, categoryId: p.categoryId ? String(p.categoryId) : '', recipeId: p.recipeId ? String(p.recipeId) : '', description: p.description ?? '', imageUrl: p.imageUrl ?? '' }) }}>Edit</Button>
                      {p.status === 'ACTIVE' && <Button size="sm" variant="outline" onClick={() => void action.run(() => brewforgeApi.products.deactivate(p.id), 'Product deactivated.', products.reload)}>Deactivate</Button>}
                    </div>
                  ),
                },
              ]),
          ]}
        />
        <Pager page={page} size={PAGE_SIZE} total={products.data.total} onPage={setPage} />
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------ recipe list (shared)

function RecipeList({
  mode,
  selected,
  onSelect,
  reloadKey,
}: {
  mode: 'author' | 'review'
  selected: RecipeDto | null
  onSelect: (r: RecipeDto) => void
  reloadKey: number
}) {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ q: '', category: '', origin: '', status: '' })
  const loader = useCallback(
    () =>
      brewforgeApi.recipes.list({
        page,
        size: PAGE_SIZE,
        q: filters.q || undefined,
        category: filters.category || undefined,
        origin: filters.origin || undefined,
        status: filters.status || undefined,
      }),
    // reloadKey forces a refetch after a change elsewhere on the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, filters, reloadKey],
  )
  const recipes = useAsyncLoad(loader, { items: [] as RecipeDto[], page: 1, size: PAGE_SIZE, total: 0 })
  const action = useAction()

  return (
    <Panel title="Recipes" description="Click a recipe to open its version history and editor.">
      <ErrorBox error={action.error ?? recipes.error} />
      <SuccessBox message={action.message} />
      <Toolbar>
        <Field label="Search"><TextInput value={filters.q} onChange={(e) => { setFilters({ ...filters, q: e.target.value }); setPage(1) }} /></Field>
        <Field label="Category">
          <Select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Origin">
          <Select value={filters.origin} onChange={(e) => setFilters({ ...filters, origin: e.target.value })}>
            <option value="">All</option><option>NEW</option><option>EXISTING</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option><option>ACTIVE</option><option>DISCONTINUED</option>
          </Select>
        </Field>
      </Toolbar>
      <Loading show={recipes.loading} />
      <DataTable
        rows={recipes.data.items}
        rowKey={(r) => r.id}
        selectedKey={selected?.id}
        onRowClick={onSelect}
        columns={[
          { header: 'Code', cell: (r) => r.recipeCode },
          { header: 'Name', cell: (r) => r.name },
          { header: 'Category', cell: (r) => r.category },
          { header: 'Origin', cell: (r) => r.origin },
          { header: 'Released', cell: (r) => (r.releasedVersionNo ? `v${r.releasedVersionNo} (#${r.releasedVersionId})` : '—') },
          { header: 'Versions', cell: (r) => r.versionCount },
          { header: 'Status', cell: (r) => <StateBadge value={r.status} /> },
          {
            header: 'Lifecycle',
            cell: (r) =>
              r.status === 'ACTIVE' ? (
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); void action.run(() => brewforgeApi.recipes.discontinue(r.id), `${r.recipeCode} discontinued.`, recipes.reload) }}>Discontinue</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); void action.run(() => brewforgeApi.recipes.activate(r.id), `${r.recipeCode} reactivated.`, recipes.reload) }}>Activate</Button>
              ),
          },
        ]}
      />
      <Pager page={page} size={PAGE_SIZE} total={recipes.data.total} onPage={setPage} />
      {mode === 'review' && <p className="mt-2 text-xs text-muted-foreground">Tip: filter the version table for VALIDATED versions awaiting review (seed: R09).</p>}
    </Panel>
  )
}

// ------------------------------------------------------------------ R&D specialist recipes

export function RecipesPage() {
  const [selected, setSelected] = useState<RecipeDto | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const action = useAction()
  const [form, setForm] = useState({ recipeCode: '', name: '', category: 'TEA' as RecipeCategory, origin: 'NEW' as RecipeOrigin })
  const [meta, setMeta] = useState<{ name: string; category: RecipeCategory } | null>(null)
  const [importForm, setImportForm] = useState({ recipeCode: '', name: '', category: 'COFFEE' as RecipeCategory })
  const [importRows, setImportRows] = useState([{ actionText: '', equipmentClass: '', techniqueGate: '', durationSeconds: '', ingredients: '', dependsOn: '' }])
  const [importValidation, setImportValidation] = useState<Parameters<typeof ValidationView>[0]['result']>(null)
  const [showImport, setShowImport] = useState(false)

  const bump = () => setReloadKey((k) => k + 1)

  return (
    <>
      <PageHeader title="Recipes & Versions" description="Create recipes, AI drafts, 3-check validation, repair, and submit for review. Import existing recipes." />
      <ErrorBox error={action.error} />
      <SuccessBox message={action.message} />
      <Panel title="Create recipe">
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Code"><TextInput value={form.recipeCode} onChange={(e) => setForm({ ...form, recipeCode: e.target.value })} /></Field>
          <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as RecipeCategory })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
          </Field>
          <Field label="Origin">
            <Select value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value as RecipeOrigin })}><option>NEW</option><option>EXISTING</option></Select>
          </Field>
          <div className="flex items-end gap-2">
            <Button size="sm" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.recipes.create(form), (r) => `Recipe ${r.recipeCode} created.`, (r) => { setSelected(r); bump() })}>Create</Button>
            <Button size="sm" variant="outline" onClick={() => setShowImport((s) => !s)}>{showImport ? 'Hide import' : 'Import existing…'}</Button>
          </div>
        </div>
      </Panel>

      {showImport && (
        <Panel title="Import an existing recipe" description="The recipe is released at once if it passes the 3 checks; existing drinks go live at every branch.">
          <div className="mb-3 grid gap-3 md:grid-cols-3">
            <Field label="Code"><TextInput value={importForm.recipeCode} onChange={(e) => setImportForm({ ...importForm, recipeCode: e.target.value })} /></Field>
            <Field label="Name"><TextInput value={importForm.name} onChange={(e) => setImportForm({ ...importForm, name: e.target.value })} /></Field>
            <Field label="Category">
              <Select value={importForm.category} onChange={(e) => setImportForm({ ...importForm, category: e.target.value as RecipeCategory })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
            </Field>
          </div>
          <StepEditor rows={importRows} onChange={setImportRows} />
          <Button
            size="sm"
            className="mt-3"
            disabled={action.busy}
            onClick={() => void action.run(() => brewforgeApi.recipes.importExisting({ ...importForm, steps: rowsToSteps(importRows) }), (r) => `Imported ${r.recipe.recipeCode}: version #${r.version.id} is ${r.version.state}.`, (r) => { setImportValidation(r.validation); setSelected(r.recipe); bump() })}
          >
            Import
          </Button>
          <ValidationView result={importValidation} />
        </Panel>
      )}

      <RecipeList mode="author" selected={selected} onSelect={(r) => { setSelected(r); setMeta(null) }} reloadKey={reloadKey} />

      {selected && (
        <>
          <Panel title="Recipe metadata">
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Name"><TextInput value={meta?.name ?? selected.name} onChange={(e) => setMeta({ name: e.target.value, category: meta?.category ?? selected.category })} /></Field>
              <Field label="Category">
                <Select value={meta?.category ?? selected.category} onChange={(e) => setMeta({ name: meta?.name ?? selected.name, category: e.target.value as RecipeCategory })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
              </Field>
              <div className="flex items-end">
                <Button size="sm" disabled={action.busy || !meta} onClick={() => meta && void action.run(() => brewforgeApi.recipes.update(selected.id, meta), 'Recipe updated.', (r) => { setSelected(r); setMeta(null); bump() })}>Save metadata</Button>
              </div>
            </div>
          </Panel>
          <RecipeVersionStudio key={selected.id} recipe={selected} mode="author" onChanged={bump} />
        </>
      )}
    </>
  )
}

// ------------------------------------------------------------------ R&D manager review & release

export function RdManagerRecipesPage() {
  const [selected, setSelected] = useState<RecipeDto | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  return (
    <>
      <PageHeader title="Review & Release" description="Validate, review every step, release with an Idempotency-Key, roll back, and discontinue/reactivate recipes." />
      <RecipeList mode="review" selected={selected} onSelect={setSelected} reloadKey={reloadKey} />
      {selected && <RecipeVersionStudio key={selected.id} recipe={selected} mode="review" onChanged={() => setReloadKey((k) => k + 1)} />}
    </>
  )
}

