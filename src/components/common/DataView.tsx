import { asRecord, rowsOf, type RecordData } from '@/services/backend/operations'
import { EmptyState } from './AsyncState'
import { label, display } from './presentation'
export function DataTable({ data, columns, onRow }: { data: unknown; columns?: string[]; onRow?: (row: RecordData) => void }) {
  const rows = rowsOf(data)
  if (!rows.length) return <EmptyState />
  const keys = columns ?? Object.keys(rows[0]).filter(k => !['id', 'permissions', 'payload', 'sha256'].includes(k) && !Array.isArray(rows[0][k]) && (rows[0][k] === null || typeof rows[0][k] !== 'object')).slice(0, 7)
  return <div className="table-wrap"><table><thead><tr>{keys.map(k => <th key={k}>{label(k)}</th>)}{onRow && <th><span className="sr-only">Chi tiết</span></th>}</tr></thead><tbody>{rows.map((row, i) => <tr key={String(row.id ?? row.enrollmentId ?? row.courseId ?? i)}>{keys.map(k => <td key={k}>{/state|status|result|verdict/i.test(k) ? <span className={`badge tone-${String(row[k]).toLowerCase()}`}>{display(row[k])}</span> : display(row[k])}</td>)}{onRow && <td><button className="text-link" onClick={() => onRow(row)}>Xem chi tiết →</button></td>}</tr>)}</tbody></table></div>
}
export function DataView({ value, title, depth = 0 }: { value: unknown; title?: string; depth?: number }) {
  if (value === null || value === undefined) return <span className="muted">—</span>
  if (Array.isArray(value)) return <section className="data-section">{title && <h3>{title}</h3>}{!value.length ? <p className="muted">Chưa có dữ liệu.</p> : value.every(v => v !== null && typeof v === 'object') ? <div className="space-y-3">{value.map((item, i) => <div className="nested-card" key={i}><DataView value={item} depth={depth + 1} /></div>)}</div> : <p>{display(value)}</p>}</section>
  if (typeof value !== 'object') return <span className="whitespace-pre-wrap">{display(value)}</span>
  const entries = Object.entries(asRecord(value)).filter(([k]) => !['accessToken', 'refreshToken', 'password', 'passwordHash'].includes(k))
  return <section className="data-section">{title && <h3>{title}</h3>}<dl className="detail-grid">{entries.filter(([, v]) => v === null || typeof v !== 'object').map(([k, v]) => <div key={k}><dt>{label(k)}</dt><dd>{/state|status|verdict|result/i.test(k) ? <span className={`badge tone-${String(v).toLowerCase()}`}>{display(v)}</span> : <DataView value={v} depth={depth + 1} />}</dd></div>)}</dl>{entries.filter(([, v]) => v !== null && typeof v === 'object').map(([k, v]) => <DataView key={k} value={v} title={label(k)} depth={depth + 1} />)}</section>
}
