import { BookOpen, Users, Clock3 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { PageHeader } from './PageHeader'
import { StatCard } from './StatCard'
import { DataTable, DataView } from './DataView'

import { LoadingState, ErrorState } from './AsyncState'
import { roleConfig } from '@/constants/roles'
import { asRecord, rowsOf, useReadQuery } from '@/services/backend/operations'
import type { Role } from '@/features/auth/authTypes'
import type { Operation } from '@/services/backend/contracts'
const sources: Record<Role, { operation: Operation; resource: string; title: string }> = {
  ADMIN: { operation: 'Users.List', resource: 'users', title: 'Tài khoản trong hệ thống' },
  RD_SPECIALIST: { operation: 'Recipes.List', resource: 'recipes', title: 'Công thức đang quản lý' },
  RD_MANAGER: { operation: 'Pilots.List', resource: 'pilots', title: 'Thử nghiệm thị trường' },
  TRAINER: { operation: 'Assignments.List', resource: 'assignments', title: 'Đăng ký học của đội ngũ' },
  TRAINEE: { operation: 'Enrollments.Mine', resource: 'learning', title: 'Khóa học của bạn' },
  BRANCH_MANAGER: { operation: 'Skills.Employees', resource: 'employees', title: 'Đội ngũ chi nhánh' },
  QUALITY_AUDITOR: { operation: 'BranchAudits.Summary', resource: 'branch-audits', title: 'Tuân thủ trong kỳ' },
  TRAINING_MANAGER: { operation: 'Courses.List', resource: 'courses', title: 'Khóa học đào tạo' },
}
export function RoleDashboard({ role }: { role: Role }) {
  const user = useAppSelector(s => s.auth.user), navigate = useNavigate(), source = sources[role], config = roleConfig[role]
  const query = useReadQuery({ operation: source.operation, query: { page: 1, size: 5 } }), data = asRecord(query.data), rows = rowsOf(query.data)
  const count = source.operation === 'BranchAudits.Summary' ? Number(data.audits ?? 0) : Number(data.total ?? rows.length)
  const attention = rows.filter(r => r.overdue || ['LOCKED', 'OUT_OF_DATE', 'PENDING_APPROVAL', 'NOT_READY'].includes(String(r.state ?? r.status))).length
  return <><div className="dashboard-greeting"><p className="eyebrow">MỖI NGÀY, TỐT HƠN MỘT CHÚT</p><PageHeader title={`Xin chào, ${user?.name ?? ''}`} description={config.description} /><div className="greeting-art"><BookOpen size={58} strokeWidth={1} /><span>BREW · LEARN · GROW</span></div></div>{query.isFetching ? <LoadingState /> : query.error ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : <><div className="grid gap-4 sm:grid-cols-3"><StatCard title={source.title} value={String(count)} description={data.from ? `${data.from} — ${data.to}` : 'Theo dữ liệu máy chủ'} icon={BookOpen} /><StatCard title={source.operation === 'BranchAudits.Summary' ? 'Kiểm định đạt' : 'Đang hiển thị'} value={String(source.operation === 'BranchAudits.Summary' ? data.passed ?? 0 : rows.length)} description="Trong tập dữ liệu đang xem" icon={Users} /><StatCard title={source.operation === 'BranchAudits.Summary' ? 'Khắc phục đang mở' : 'Cần chú ý trên trang'} value={String(source.operation === 'BranchAudits.Summary' ? data.openCorrectiveActions ?? 0 : attention)} description="Mở danh sách để xem đầy đủ" icon={Clock3} /></div><section className="panel mt-8"><div className="section-header"><h2>{source.title}</h2><Link className="text-link" to={config.prefix + '/' + source.resource}>Xem đầy đủ →</Link></div>{source.operation === 'BranchAudits.Summary' ? <DataView value={query.data} /> : <DataTable data={query.data} onRow={() => navigate(config.prefix + '/' + source.resource)} />}</section></>}<div className="dashboard-footer"><CoffeeMark /><p>Tiêu chuẩn rõ ràng tạo nên trải nghiệm nhất quán.</p></div></>
}
function CoffeeMark() { return <span className="eyebrow">BREWFORGE</span> }
