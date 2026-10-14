import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/app/hooks'
import { executeOperation, canCall } from '@/services/backend/operations'
import type { EvidenceDto } from '@/services/backend/contracts'
import { normalizeApiError } from '@/services/apiError'
import { ErrorState } from './AsyncState'
export function EvidenceInput({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const user = useAppSelector(s => s.auth.user), [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState<unknown>(null)
  async function upload() { setBusy(true); setError(null); try {
    if (!file || !/\.(jpg|jpeg|png|webp)$/i.test(file.name) || file.size === 0 || file.size > 5 * 1024 * 1024) throw new Error('Chọn ảnh JPG/PNG/WEBP không rỗng, tối đa 5 MB.')
    const form = new FormData(); form.append('file', file)
    const data = await executeOperation('BranchAudits.UploadEvidence', { body: form }) as EvidenceDto
    onChange(data.url)
  } catch (e) { setError(normalizeApiError(e)) } finally { setBusy(false) } }
  return <div className="space-y-2"><Input aria-label="Đường dẫn ảnh minh chứng" value={String(value ?? '')} onChange={e => onChange(e.target.value || null)} placeholder="Đường dẫn minh chứng (nếu đã có)" />{canCall('BranchAudits.UploadEvidence', user?.role) && <div className="flex flex-wrap gap-2"><input aria-label="Chọn ảnh minh chứng" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => setFile(e.target.files?.[0] ?? null)} /><Button type="button" variant="outline" disabled={!file || busy} onClick={() => void upload()}>{busy ? 'Đang tải…' : 'Tải ảnh & gắn minh chứng'}</Button></div>}{error !== null && <ErrorState error={error} />}{!!value && <p className="field-help">Ảnh/đường dẫn sẽ được gắn vào tiêu chí khi lưu kiểm định.</p>}</div>
}
