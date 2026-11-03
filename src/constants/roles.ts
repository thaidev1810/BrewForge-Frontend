import type { Role } from '@/features/auth/authTypes'
export const roleConfig: Record<Role, { label: string; prefix: string; description: string }> = {
  ADMIN: { label: 'Quản trị viên', prefix: '/admin', description: 'Quản lý tài khoản, danh mục và cấu hình công ty.' },
  RD_SPECIALIST: { label: 'Chuyên viên R&D', prefix: '/rd-specialist', description: 'Phát triển sản phẩm và chuẩn hóa công thức.' },
  RD_MANAGER: { label: 'Quản lý R&D', prefix: '/rd-manager', description: 'Duyệt SOP và khóa học, theo dõi thử nghiệm và triển khai sản phẩm.' },
  TRAINER: { label: 'Giảng viên', prefix: '/trainer', description: 'Biên soạn khóa học, tổ chức lớp và đánh giá thực hành.' },
  TRAINEE: { label: 'Học viên', prefix: '/barista', description: 'Học quy trình, làm bài kiểm tra và phát triển kỹ năng.' },
  BRANCH_MANAGER: { label: 'Quản lý chi nhánh', prefix: '/store-manager', description: 'Theo dõi đội ngũ, doanh số và chất lượng chi nhánh.' },
  QUALITY_AUDITOR: { label: 'Kiểm định chất lượng', prefix: '/quality-auditor', description: 'Kiểm tra tuân thủ và theo dõi khắc phục sai lệch.' },
  TRAINING_MANAGER: { label: 'Quản lý đào tạo', prefix: '/training-manager', description: 'Quản lý quy định, giao khóa, tiến độ và hiệu quả đào tạo.' },
}
export const dashboardPath = (role: Role) => `${roleConfig[role].prefix}/dashboard`
