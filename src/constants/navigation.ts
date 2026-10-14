import type { Role } from '@/features/auth/authTypes'
import { canCall } from '@/services/backend/operations'
import { resources, reportPages } from '@/features/workspace/resources'
export function navigationFor(role: Role) {
  return [
    { key: 'dashboard', title: 'Tổng quan', group: 'Workspace' },
    ...resources.filter(r => canCall(r.list, role)).map(r => ({ key: r.key, title: r.title, group: ['users', 'settings', 'categories', 'branches', 'ingredients', 'equipment', 'products'].includes(r.key) ? 'Danh mục & quản trị' : ['recipes', 'pilots', 'launch'].includes(r.key) ? 'Tiêu chuẩn & vận hành' : ['branch-audits', 'corrective-actions', 'audit-log'].includes(r.key) ? 'Chất lượng' : r.key === 'sales' ? 'Vận hành' : 'Đào tạo' })),
    ...reportPages.filter(p => canCall(p.operation, role)).map(p => ({ key: p.key, title: p.title, group: 'Báo cáo' })),
    ...(canCall('Sales.Aggregate', role) ? [{ key: 'sales-analytics', title: 'Phân tích doanh số', group: 'Báo cáo' }] : []),
    ...(canCall('ImpactAnalysis.Analyze', role) ? [{ key: 'impact', title: 'Phân tích ảnh hưởng', group: 'Tiêu chuẩn & vận hành' }] : []),
    ...(canCall('AuditLog.Trace', role) ? [{ key: 'trace', title: 'Truy vết tiêu chuẩn', group: 'Chất lượng' }] : []),
    ...(canCall('Reports.Compliance', role) ? [{ key: 'compliance', title: 'Xuất báo cáo chứng nhận', group: 'Báo cáo' }] : []),
    { key: 'account', title: 'Tài khoản', group: 'Cá nhân' }, { key: 'push', title: 'Thông báo trình duyệt', group: 'Cá nhân' },
  ]
}
