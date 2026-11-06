import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { roleConfig } from '@/constants/roles'
import { asRecord, useReadQuery } from '@/services/backend/operations'

export function NotificationBell() {
  const user = useAppSelector(s => s.auth.user)
  const query = useReadQuery({ operation: 'Notifications.UnreadCount' }, { skip: !user })
  if (!user) return null
  const count = asRecord(query.currentData).count
  return <Link className="text-link flex items-center gap-1" to={roleConfig[user.role].prefix + '/notifications'} aria-label="Hộp thông báo"><Bell size={19} />{typeof count === 'number' ? <span aria-label="Số thông báo chưa đọc">{count}</span> : <span aria-label={query.error ? 'Không tải được số chưa đọc' : 'Đang tải số chưa đọc'}>…</span>}</Link>
}
