import type { Role } from '@/features/auth/authTypes'
import { canCall } from '@/services/backend/operations'
import { resources, reportPages } from '@/features/workspace/resources'
export function navigationFor(role: Role) {
  const training = 'Đào tạo', recipes = 'Công thức & sản phẩm', operations = 'Vận hành chi nhánh', quality = 'Chất lượng', admin = 'Quản trị hệ thống'
  const entries = [
    { key: 'dashboard', title: 'Tổng quan', group: 'Tổng quan' },
    ...resources.filter(r => canCall(r.list, role)).map(r => ({ key: r.key, title: r.key === 'courses' ? 'Quản lý khóa học' : r.key === 'learning' ? 'Khóa học của tôi' : r.key === 'users' ? 'Quản lý tài khoản' : r.title, group: ['users','settings','categories','audit-log'].includes(r.key) ? admin : ['ingredients','equipment','products','recipes'].includes(r.key) ? recipes : ['branches','pilots','launch','sales'].includes(r.key) ? operations : ['branch-audits','corrective-actions'].includes(r.key) ? quality : training })),
    ...reportPages.filter(p => canCall(p.operation, role)).map(p => ({ key: p.key, title: p.title, group: 'Báo cáo' })),
    ...(canCall('Sales.Aggregate', role) ? [{ key: 'sales-analytics', title: 'Phân tích doanh số', group: 'Báo cáo' }] : []),
    ...(canCall('ImpactAnalysis.Analyze', role) ? [{ key: 'impact', title: 'Phân tích ảnh hưởng', group: recipes }] : []),
    ...(canCall('AuditLog.Trace', role) ? [{ key: 'trace', title: 'Truy vết tiêu chuẩn', group: quality }] : []),
    ...(canCall('Reports.Compliance', role) ? [{ key: 'compliance', title: 'Xuất báo cáo chứng nhận', group: 'Báo cáo' }] : []),
    ...(canCall('LearningPath.Mine', role) || canCall('LearningPath.Get', role) ? [{ key: 'learning-path', title: 'Lộ trình học', group: training }] : []),
    ...(canCall('Courses.Approve', role) ? [{ key: 'courses/pending', title: 'Khóa chờ duyệt', group: training }] : []),
    { key: 'notifications', title: 'Hộp thông báo', group: 'Cá nhân' },
    { key: 'account', title: 'Tài khoản', group: 'Cá nhân' }, { key: 'push', title: 'Thông báo trình duyệt', group: 'Cá nhân' },
  ]
  const groupOrder = role === 'ADMIN' ? ['Tổng quan',admin,recipes,operations,training,quality,'Báo cáo','Cá nhân'] : role === 'TRAINEE' || role === 'TRAINER' || role === 'TRAINING_MANAGER' ? ['Tổng quan',training,operations,recipes,quality,'Báo cáo',admin,'Cá nhân'] : role === 'BRANCH_MANAGER' ? ['Tổng quan',operations,training,quality,'Báo cáo',recipes,admin,'Cá nhân'] : role === 'QUALITY_AUDITOR' ? ['Tổng quan',quality,'Báo cáo',training,operations,recipes,admin,'Cá nhân'] : ['Tổng quan',recipes,training,operations,quality,'Báo cáo',admin,'Cá nhân']
  const priority = role === 'TRAINEE' ? ['learning-path','learning','certificates','skills'] : role === 'TRAINER' ? ['courses','classes','assignments','agenda','learning-path','learning'] : role === 'TRAINING_MANAGER' ? ['courses/pending','assignments','classes','regulations','learning-path','courses'] : ['launch','sales','branch-audits','corrective-actions']
  return entries.sort((a,b) => groupOrder.indexOf(a.group)-groupOrder.indexOf(b.group) || (priority.includes(a.key)?priority.indexOf(a.key):100)-(priority.includes(b.key)?priority.indexOf(b.key):100))
}

export function navigationEntryFor(role: Role, pathname: string, prefix: string) {
  const entries = navigationFor(role)
  const direct = entries.filter(entry => pathname === `${prefix}/${entry.key}` || pathname.startsWith(`${prefix}/${entry.key}/`)).sort((a,b) => b.key.length-a.key.length)[0]
  if (direct) return direct
  const relative = pathname.slice(prefix.length)
  const parent = relative.startsWith('/enrollments/') ? (entries.some(entry=>entry.key==='assignments')?'assignments':'employees') : relative.startsWith('/versions/') ? 'recipes' : relative.startsWith('/assessment/') ? 'agenda' : relative.startsWith('/videos/') ? 'learning' : null
  return entries.find(entry => entry.key === parent)
}
