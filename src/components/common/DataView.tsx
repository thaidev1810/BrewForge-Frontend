import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Fold, ReadMore } from './DetailLayout'
import { asRecord, rowsOf, type RecordData } from '@/services/backend/operations'
import { EmptyState } from './AsyncState'
import { label, display, displayField } from './presentation'
export function DataTable({ data, columns, onRow, pageSize }: { data: unknown; columns?: string[]; onRow?: (row: RecordData) => void; pageSize?: number }) {
  const rows = rowsOf(data), [page,setPage]=useState(1)
  const current=pageSize?Math.min(page,Math.max(1,Math.ceil(rows.length/pageSize))):1, visible=pageSize?rows.slice((current-1)*pageSize,current*pageSize):rows
  if (!rows.length) return <EmptyState />
  const keys = columns ?? Object.keys(rows[0]).filter(k => !['id', 'permissions', 'payload', 'sha256'].includes(k) && !Array.isArray(rows[0][k]) && (rows[0][k] === null || typeof rows[0][k] !== 'object')).slice(0, 7)
  return <><div className="table-wrap"><table><thead><tr>{keys.map(k => <th key={k}>{label(k)}</th>)}{onRow && <th><span className="sr-only">Chi tiết</span></th>}</tr></thead><tbody>{visible.map((row, i) => <tr key={String(row.id ?? row.enrollmentId ?? row.courseId ?? i)}>{keys.map(k => <td key={k}>{/state|status|stage|result|verdict/i.test(k) ? <span className={`badge tone-${String(row[k]).toLowerCase()}`}>{display(row[k])}</span> : <ReadMore text={displayField(k,row[k])} />}</td>)}{onRow && <td><button className="text-link" onClick={() => onRow(row)}>Xem chi tiết →</button></td>}</tr>)}</tbody></table></div>{pageSize&&rows.length>pageSize&&<div className="pagination"><span>{rows.length} mục · Trang {current}/{Math.ceil(rows.length/pageSize)}</span><Button variant="outline" disabled={current===1} onClick={()=>setPage(current-1)}>Trước</Button><Button variant="outline" disabled={current*pageSize>=rows.length} onClick={()=>setPage(current+1)}>Sau</Button></div>}</>
}
export function DataView({ value, title, depth = 0 }: { value: unknown; title?: string; depth?: number }) {
  if (value === null || value === undefined) return <span className="muted">—</span>
  if (Array.isArray(value)) return <section className="data-section">{title && <h3>{title}</h3>}{!value.length ? <p className="muted">Chưa có dữ liệu.</p> : value.every(v => v !== null && typeof v === 'object') ? <div className="space-y-3">{value.map((item, i) => <Fold key={i} title={String(asRecord(item).title??asRecord(item).fullName??asRecord(item).criterion??asRecord(item).actionText??('Mục '+(i+1)))} open={asRecord(item).passed===false||asRecord(item).critical===true}><DataView value={item} depth={depth+1}/></Fold>)}</div> : <p>{display(value)}</p>}</section>
  if (typeof value !== 'object') return <ReadMore text={display(value)} />
  const entries = Object.entries(asRecord(value)).filter(([k]) => !['accessToken', 'refreshToken', 'password', 'passwordHash'].includes(k))
  return <section className="data-section">{title && <h3>{title}</h3>}<dl className="detail-grid">{entries.filter(([, v]) => v === null || typeof v !== 'object').map(([k, v]) => <div key={k}><dt>{label(k)}</dt><dd>{/state|status|stage|verdict|result/i.test(k) ? <span className={`badge tone-${String(v).toLowerCase()}`}>{display(v)}</span> : <ReadMore text={displayField(k,v)} />}</dd></div>)}</dl>{entries.filter(([, v]) => v !== null && typeof v === 'object').map(([k, v]) => <Fold key={k} title={label(k)}><DataView value={v} depth={depth + 1} /></Fold>)}</section>
}
