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
  fmtDate,
  useAction,
  JsonView,
} from '@/components/common/Kit'
import { useAsyncLoad } from '@/hooks/useAsyncLoad'
import { brewforgeApi } from '@/services/brewforgeApi'
import { ROLES, type Role } from '@/features/auth/authTypes'
import type {
  AuditEntryDto,
  BranchDto,
  CategoryDto,
  CategoryKind,
  DosingUnit,
  EquipmentClassDto,
  IngredientDto,
  IngredientUnit,
  UserDto,
} from '@/types/backend'

const PAGE_SIZE = 20

function useBranches() {
  const loader = useCallback(async () => (await brewforgeApi.branches.list({ page: 1, size: 100 })).items, [])
  return useAsyncLoad<BranchDto[]>(loader, [])
}

// ------------------------------------------------------------------ users

const emptyUser = { username: '', email: '', password: '', fullName: '', role: 'TRAINEE' as Role, branchId: '' }

export function UsersPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const loader = useCallback(
    () => brewforgeApi.users.list({ page, size: PAGE_SIZE, q: q || undefined, role: role || undefined, status: status || undefined }),
    [page, q, role, status],
  )
  const users = useAsyncLoad(loader, { items: [] as UserDto[], page: 1, size: PAGE_SIZE, total: 0 })
  const branches = useBranches()
  const action = useAction()
  const [form, setForm] = useState(emptyUser)
  const [editing, setEditing] = useState<UserDto | null>(null)

  const branchCode = (id: number | null) => branches.data.find((b) => b.id === id)?.branchCode ?? (id ? `#${id}` : 'HQ')
  const needsBranch = form.role === 'TRAINEE' || form.role === 'BRANCH_MANAGER'

  const submit = () => {
    const branchId = form.branchId ? Number(form.branchId) : null
    if (editing) {
      void action.run(
        () =>
          brewforgeApi.users.update(editing.id, {
            email: form.email,
            fullName: form.fullName,
            role: form.role,
            branchId,
            password: form.password || undefined,
          }),
        'User updated.',
        () => {
          setEditing(null)
          setForm(emptyUser)
          users.reload()
        },
      )
    } else {
      void action.run(
        () => brewforgeApi.users.create({ ...form, branchId }),
        'User created.',
        () => {
          setForm(emptyUser)
          users.reload()
        },
      )
    }
  }

  return (
    <>
      <PageHeader title="Users & Roles" description="Create, edit, reset passwords, deactivate/reactivate accounts. Users are never deleted." />
      <ErrorBox error={action.error ?? users.error} />
      <SuccessBox message={action.message} />
      <Panel title={editing ? `Edit user #${editing.id}` : 'Create user'}>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Username"><TextInput value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
          <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Full name"><TextInput value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label={editing ? 'New password (optional reset)' : 'Password (min 8)'}>
            <TextInput type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label={needsBranch ? 'Branch (required)' : 'Branch (none for head office)'}>
            <Select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">— none —</option>
              {branches.data.map((b) => <option key={b.id} value={b.id}>{b.branchCode} · {b.name}</option>)}
            </Select>
          </Field>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" disabled={action.busy} onClick={submit}>{editing ? 'Save changes' : 'Create user'}</Button>
          {editing && <Button size="sm" variant="outline" onClick={() => { setEditing(null); setForm(emptyUser) }}>Cancel</Button>}
        </div>
      </Panel>
      <Panel title="All users">
        <Toolbar>
          <Field label="Search"><TextInput value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="username, name, email" /></Field>
          <Field label="Role">
            <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}>
              <option value="">All</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
              <option value="">All</option><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option>
            </Select>
          </Field>
        </Toolbar>
        <Loading show={users.loading} />
        <DataTable
          rows={users.data.items}
          rowKey={(u) => u.id}
          columns={[
            { header: 'Username', cell: (u) => u.username },
            { header: 'Name', cell: (u) => u.fullName },
            { header: 'Email', cell: (u) => u.email },
            { header: 'Role', cell: (u) => u.role },
            { header: 'Branch', cell: (u) => branchCode(u.branchId) },
            { header: 'Status', cell: (u) => <StateBadge value={u.status} /> },
            {
              header: 'Actions',
              cell: (u) => (
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(u); setForm({ username: u.username, email: u.email, fullName: u.fullName, password: '', role: u.role, branchId: u.branchId ? String(u.branchId) : '' }) }}>Edit</Button>
                  {u.status === 'ACTIVE' ? (
                    <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.users.deactivate(u.id), 'User deactivated.', users.reload)}>Deactivate</Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.users.update(u.id, { email: u.email, fullName: u.fullName, role: u.role, branchId: u.branchId, status: 'ACTIVE' }), 'User reactivated.', users.reload)}>Reactivate</Button>
                  )}
                </div>
              ),
            },
          ]}
        />
        <Pager page={page} size={PAGE_SIZE} total={users.data.total} onPage={setPage} />
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------ branches

export function BranchesPage() {
  const branches = useBranches()
  const action = useAction()
  const empty = { branchCode: '', name: '', address: '' }
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<BranchDto | null>(null)

  const submit = () =>
    void action.run(
      () => (editing ? brewforgeApi.branches.update(editing.id, { ...form, status: editing.status }) : brewforgeApi.branches.create(form)),
      editing ? 'Branch updated.' : 'Branch created.',
      () => { setEditing(null); setForm(empty); branches.reload() },
    )

  return (
    <>
      <PageHeader title="Branches" description="Store locations. Closing a branch keeps all history (never deleted)." />
      <ErrorBox error={action.error ?? branches.error} />
      <SuccessBox message={action.message} />
      <Panel title={editing ? `Edit ${editing.branchCode}` : 'Create branch'}>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Code"><TextInput value={form.branchCode} onChange={(e) => setForm({ ...form, branchCode: e.target.value })} /></Field>
          <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Address"><TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" disabled={action.busy} onClick={submit}>{editing ? 'Save' : 'Create'}</Button>
          {editing && <Button size="sm" variant="outline" onClick={() => { setEditing(null); setForm(empty) }}>Cancel</Button>}
        </div>
      </Panel>
      <Panel title="All branches">
        <Loading show={branches.loading} />
        <DataTable
          rows={branches.data}
          rowKey={(b) => b.id}
          columns={[
            { header: 'Code', cell: (b) => b.branchCode },
            { header: 'Name', cell: (b) => b.name },
            { header: 'Address', cell: (b) => b.address ?? '—' },
            { header: 'Status', cell: (b) => <StateBadge value={b.status} /> },
            {
              header: 'Actions',
              cell: (b) => (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(b); setForm({ branchCode: b.branchCode, name: b.name, address: b.address ?? '' }) }}>Edit</Button>
                  {b.status === 'ACTIVE' ? (
                    <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.branches.deactivate(b.id), 'Branch closed.', branches.reload)}>Close</Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={action.busy} onClick={() => void action.run(() => brewforgeApi.branches.update(b.id, { branchCode: b.branchCode, name: b.name, address: b.address, status: 'ACTIVE' }), 'Branch reopened.', branches.reload)}>Reopen</Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------ categories

const KINDS: CategoryKind[] = ['DRINK', 'INGREDIENT', 'TRAINING', 'EQUIPMENT']

export function CategoriesPage() {
  const [kind, setKind] = useState('')
  const loader = useCallback(async () => (await brewforgeApi.categories.list({ page: 1, size: 100, kind: kind || undefined })).items, [kind])
  const categories = useAsyncLoad<CategoryDto[]>(loader, [])
  const action = useAction()
  const empty = { kind: 'DRINK' as CategoryKind, code: '', name: '' }
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<CategoryDto | null>(null)

  const submit = () =>
    void action.run(
      () => (editing ? brewforgeApi.categories.update(editing.id, { ...form, status: editing.status }) : brewforgeApi.categories.create(form)),
      editing ? 'Category updated.' : 'Category created.',
      () => { setEditing(null); setForm(empty); categories.reload() },
    )

  return (
    <>
      <PageHeader title="Categories" description="Drink, ingredient, training and equipment categories." />
      <ErrorBox error={action.error ?? categories.error} />
      <SuccessBox message={action.message} />
      <Panel title={editing ? `Edit ${editing.code}` : 'Create category'}>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Kind">
            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as CategoryKind })}>
              {KINDS.map((k) => <option key={k}>{k}</option>)}
            </Select>
          </Field>
          <Field label="Code"><TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" disabled={action.busy} onClick={submit}>{editing ? 'Save' : 'Create'}</Button>
          {editing && <Button size="sm" variant="outline" onClick={() => { setEditing(null); setForm(empty) }}>Cancel</Button>}
        </div>
      </Panel>
      <Panel title="All categories">
        <Toolbar>
          <Field label="Kind">
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">All</option>
              {KINDS.map((k) => <option key={k}>{k}</option>)}
            </Select>
          </Field>
        </Toolbar>
        <Loading show={categories.loading} />
        <DataTable
          rows={categories.data}
          rowKey={(c) => c.id}
          columns={[
            { header: 'Kind', cell: (c) => c.kind },
            { header: 'Code', cell: (c) => c.code },
            { header: 'Name', cell: (c) => c.name },
            { header: 'Status', cell: (c) => <StateBadge value={c.status} /> },
            {
              header: 'Actions',
              cell: (c) => (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(c); setForm({ kind: c.kind, code: c.code, name: c.name }) }}>Edit</Button>
                  {c.status === 'ACTIVE' ? (
                    <Button size="sm" variant="outline" onClick={() => void action.run(() => brewforgeApi.categories.deactivate(c.id), 'Deactivated.', categories.reload)}>Deactivate</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => void action.run(() => brewforgeApi.categories.update(c.id, { kind: c.kind, code: c.code, name: c.name, status: 'ACTIVE' }), 'Reactivated.', categories.reload)}>Reactivate</Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------ ingredients

const UNITS: IngredientUnit[] = ['g', 'ml', 'pcs']

export function IngredientsPage() {
  const loader = useCallback(async () => (await brewforgeApi.ingredients.list({ page: 1, size: 100 })).items, [])
  const ingredients = useAsyncLoad<IngredientDto[]>(loader, [])
  const action = useAction()
  const empty = { ingredientCode: '', name: '', unit: 'g' as IngredientUnit, shelfLifeHours: 24, storageRule: '' }
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<IngredientDto | null>(null)

  const submit = () =>
    void action.run(
      () => (editing ? brewforgeApi.ingredients.update(editing.id, { ...form, status: editing.status }) : brewforgeApi.ingredients.create(form)),
      editing ? 'Ingredient updated (run Impact Analysis to see affected recipes).' : 'Ingredient created.',
      () => { setEditing(null); setForm(empty); ingredients.reload() },
    )

  return (
    <>
      <PageHeader title="Ingredients" description="Master ingredient catalog used by the INGREDIENT validation check." />
      <ErrorBox error={action.error ?? ingredients.error} />
      <SuccessBox message={action.message} />
      <Panel title={editing ? `Edit ${editing.ingredientCode}` : 'Create ingredient'}>
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Code"><TextInput value={form.ingredientCode} onChange={(e) => setForm({ ...form, ingredientCode: e.target.value })} /></Field>
          <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Unit">
            <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as IngredientUnit })}>
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </Select>
          </Field>
          <Field label="Shelf life (hours)"><TextInput type="number" value={form.shelfLifeHours} onChange={(e) => setForm({ ...form, shelfLifeHours: Number(e.target.value) })} /></Field>
          <Field label="Storage rule"><TextInput value={form.storageRule} onChange={(e) => setForm({ ...form, storageRule: e.target.value })} /></Field>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" disabled={action.busy} onClick={submit}>{editing ? 'Save' : 'Create'}</Button>
          {editing && <Button size="sm" variant="outline" onClick={() => { setEditing(null); setForm(empty) }}>Cancel</Button>}
        </div>
      </Panel>
      <Panel title="All ingredients">
        <Loading show={ingredients.loading} />
        <DataTable
          rows={ingredients.data}
          rowKey={(i) => i.id}
          columns={[
            { header: 'ID', cell: (i) => i.id },
            { header: 'Code', cell: (i) => i.ingredientCode },
            { header: 'Name', cell: (i) => i.name },
            { header: 'Unit', cell: (i) => i.unit },
            { header: 'Shelf life', cell: (i) => `${i.shelfLifeHours}h` },
            { header: 'Storage', cell: (i) => i.storageRule ?? '—' },
            { header: 'Status', cell: (i) => <StateBadge value={i.status} /> },
            {
              header: 'Actions',
              cell: (i) => (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(i); setForm({ ingredientCode: i.ingredientCode, name: i.name, unit: i.unit, shelfLifeHours: i.shelfLifeHours, storageRule: i.storageRule ?? '' }) }}>Edit</Button>
                  {i.status === 'ACTIVE' ? (
                    <Button size="sm" variant="outline" onClick={() => void action.run(() => brewforgeApi.ingredients.deactivate(i.id), 'Deactivated.', ingredients.reload)}>Deactivate</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => void action.run(() => brewforgeApi.ingredients.update(i.id, { ingredientCode: i.ingredientCode, name: i.name, unit: i.unit, shelfLifeHours: i.shelfLifeHours, storageRule: i.storageRule, status: 'ACTIVE' }), 'Reactivated.', ingredients.reload)}>Reactivate</Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------ equipment

const DOSING: DosingUnit[] = ['g', 'ml', 'sec', 'degC', 'bar']

export function EquipmentPage() {
  const loader = useCallback(async () => (await brewforgeApi.equipment.list({ page: 1, size: 100 })).items, [])
  const equipment = useAsyncLoad<EquipmentClassDto[]>(loader, [])
  const action = useAction()
  const empty = { equipmentCode: '', equipmentClass: '', minThreshold: 0, maxThreshold: 0, dosingUnit: 'ml' as DosingUnit }
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<EquipmentClassDto | null>(null)

  const submit = () =>
    void action.run(
      () => (editing ? brewforgeApi.equipment.update(editing.id, { ...form, status: editing.status }) : brewforgeApi.equipment.create(form)),
      editing ? 'Equipment updated.' : 'Equipment created.',
      () => { setEditing(null); setForm(empty); equipment.reload() },
    )

  return (
    <>
      <PageHeader title="Equipment Standards" description="Standard equipment classes with dosing bounds used by the EQUIPMENT validation check." />
      <ErrorBox error={action.error ?? equipment.error} />
      <SuccessBox message={action.message} />
      <Panel title={editing ? `Edit ${editing.equipmentCode}` : 'Create equipment class'}>
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Code"><TextInput value={form.equipmentCode} onChange={(e) => setForm({ ...form, equipmentCode: e.target.value })} /></Field>
          <Field label="Class"><TextInput value={form.equipmentClass} onChange={(e) => setForm({ ...form, equipmentClass: e.target.value })} /></Field>
          <Field label="Min"><TextInput type="number" value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: Number(e.target.value) })} /></Field>
          <Field label="Max"><TextInput type="number" value={form.maxThreshold} onChange={(e) => setForm({ ...form, maxThreshold: Number(e.target.value) })} /></Field>
          <Field label="Unit">
            <Select value={form.dosingUnit} onChange={(e) => setForm({ ...form, dosingUnit: e.target.value as DosingUnit })}>
              {DOSING.map((u) => <option key={u}>{u}</option>)}
            </Select>
          </Field>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" disabled={action.busy} onClick={submit}>{editing ? 'Save' : 'Create'}</Button>
          {editing && <Button size="sm" variant="outline" onClick={() => { setEditing(null); setForm(empty) }}>Cancel</Button>}
        </div>
      </Panel>
      <Panel title="All equipment classes">
        <Loading show={equipment.loading} />
        <DataTable
          rows={equipment.data}
          rowKey={(e) => e.id}
          columns={[
            { header: 'ID', cell: (e) => e.id },
            { header: 'Code', cell: (e) => e.equipmentCode },
            { header: 'Class', cell: (e) => e.equipmentClass },
            { header: 'Range', cell: (e) => `${e.minThreshold} – ${e.maxThreshold} ${e.dosingUnit}` },
            { header: 'Status', cell: (e) => <StateBadge value={e.status} /> },
            {
              header: 'Actions',
              cell: (e) => (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(e); setForm({ equipmentCode: e.equipmentCode, equipmentClass: e.equipmentClass, minThreshold: e.minThreshold, maxThreshold: e.maxThreshold, dosingUnit: e.dosingUnit }) }}>Edit</Button>
                  {e.status === 'ACTIVE' ? (
                    <Button size="sm" variant="outline" onClick={() => void action.run(() => brewforgeApi.equipment.deactivate(e.id), 'Deactivated.', equipment.reload)}>Deactivate</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => void action.run(() => brewforgeApi.equipment.update(e.id, { equipmentCode: e.equipmentCode, equipmentClass: e.equipmentClass, minThreshold: e.minThreshold, maxThreshold: e.maxThreshold, dosingUnit: e.dosingUnit, status: 'ACTIVE' }), 'Reactivated.', equipment.reload)}>Reactivate</Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------ settings

export function SettingsPage() {
  const loader = useCallback(() => brewforgeApi.settings.list(), [])
  const settings = useAsyncLoad(loader, [])
  const action = useAction()
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  return (
    <>
      <PageHeader title="System Settings" description="Key/value settings such as company.name and audit.pass_mark." />
      <ErrorBox error={action.error ?? settings.error} />
      <SuccessBox message={action.message} />
      <Panel title="Settings">
        <Loading show={settings.loading} />
        <DataTable
          rows={settings.data}
          rowKey={(s) => s.key}
          columns={[
            { header: 'Key', cell: (s) => <code>{s.key}</code> },
            { header: 'Value', cell: (s) => <TextInput value={drafts[s.key] ?? s.value} onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })} /> },
            { header: 'Updated', cell: (s) => fmtDate(s.updatedAt) },
            {
              header: '',
              cell: (s) => (
                <Button size="sm" disabled={action.busy || drafts[s.key] === undefined} onClick={() => void action.run(() => brewforgeApi.settings.update(s.key, drafts[s.key] ?? s.value), `Saved ${s.key}.`, settings.reload)}>
                  Save
                </Button>
              ),
            },
          ]}
        />
      </Panel>
    </>
  )
}

// ------------------------------------------------------------------ audit log (shared)

export function AuditLogPanel() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ entityType: '', entityId: '', action: '', from: '', to: '' })
  const [applied, setApplied] = useState(filters)
  const loader = useCallback(
    () =>
      brewforgeApi.audit.listLogs({
        page,
        size: PAGE_SIZE,
        sort: 'createdAt,desc',
        entityType: applied.entityType || undefined,
        entityId: applied.entityId ? Number(applied.entityId) : undefined,
        action: applied.action || undefined,
        from: applied.from || undefined,
        to: applied.to || undefined,
      }),
    [page, applied],
  )
  const logs = useAsyncLoad(loader, { items: [] as AuditEntryDto[], page: 1, size: PAGE_SIZE, total: 0 })
  const [selected, setSelected] = useState<AuditEntryDto | null>(null)

  return (
    <Panel title="Audit log" description="Every state change written by the backend (append-only).">
      <ErrorBox error={logs.error} />
      <Toolbar>
        <Field label="Entity type"><TextInput value={filters.entityType} onChange={(e) => setFilters({ ...filters, entityType: e.target.value })} placeholder="RecipeVersion, Course…" /></Field>
        <Field label="Entity ID"><TextInput value={filters.entityId} onChange={(e) => setFilters({ ...filters, entityId: e.target.value })} /></Field>
        <Field label="Action"><TextInput value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} /></Field>
        <Field label="From"><TextInput type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></Field>
        <Field label="To"><TextInput type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></Field>
        <Button size="sm" onClick={() => { setApplied(filters); setPage(1) }}>Filter</Button>
      </Toolbar>
      <Loading show={logs.loading} />
      <DataTable
        rows={logs.data.items}
        rowKey={(l) => l.id}
        onRowClick={setSelected}
        selectedKey={selected?.id}
        columns={[
          { header: 'When', cell: (l) => fmtDate(l.createdAt) },
          { header: 'User', cell: (l) => l.username ?? l.userId ?? 'system' },
          { header: 'Entity', cell: (l) => `${l.entityType} #${l.entityId}` },
          { header: 'Action', cell: (l) => l.action },
        ]}
      />
      <Pager page={page} size={PAGE_SIZE} total={logs.data.total} onPage={setPage} />
      {selected && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium">Payload of entry #{selected.id}</p>
          <JsonView value={selected.payload} />
        </div>
      )}
    </Panel>
  )
}

export function AdminAuditLogsPage() {
  return (
    <>
      <PageHeader title="Audit Logs" description="System-wide audit trail." />
      <AuditLogPanel />
    </>
  )
}
