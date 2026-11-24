import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  Boxes,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Coffee,
  FileSearch,
  FlaskConical,
  FolderTree,
  Gauge,
  GitBranch,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Microscope,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/features/auth/authTypes'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

interface RoleConfig {
  label: string
  prefix: string
  description: string
  nav: NavItem[]
}

const dashboard = (prefix: string): NavItem => ({
  to: `${prefix}/dashboard`,
  label: 'Dashboard',
  icon: LayoutDashboard,
})

export const roleConfig: Record<Role, RoleConfig> = {
  ADMIN: {
    label: 'Administrator',
    prefix: '/admin',
    description: 'Manage users, branches, master catalogs, system settings, and audit trails.',
    nav: [
      dashboard('/admin'),
      { to: '/admin/users', label: 'Users & Roles', icon: Users },
      { to: '/admin/branches', label: 'Branches', icon: Building2 },
      { to: '/admin/categories', label: 'Categories', icon: FolderTree },
      { to: '/admin/ingredients', label: 'Ingredients', icon: Boxes },
      { to: '/admin/equipment', label: 'Equipment Standards', icon: Wrench },
      { to: '/admin/settings', label: 'System Settings', icon: Settings },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileSearch },
      { to: '/admin/finance-ai', label: 'Finance & Cashflow', icon: TrendingUp },
      { to: '/admin/sensory-lab', label: 'Sensory Lab', icon: Microscope },
    ],
  },
  RD_SPECIALIST: {
    label: 'R&D Specialist',
    prefix: '/rd-specialist',
    description: 'Author drink products, recipes and SOP versions, with drafting help and automatic checks.',
    nav: [
      dashboard('/rd-specialist'),
      { to: '/rd-specialist/products', label: 'Products', icon: Coffee },
      { to: '/rd-specialist/recipes', label: 'Recipes & Versions', icon: FlaskConical },
      { to: '/rd-specialist/sensory-lab', label: 'Sensory Lab', icon: Microscope },
    ],
  },
  RD_MANAGER: {
    label: 'R&D Manager',
    prefix: '/rd-manager',
    description: 'Review and release recipe versions, run pilots and rollouts, analyze impact, and monitor sales.',
    nav: [
      dashboard('/rd-manager'),
      { to: '/rd-manager/recipes', label: 'Review & Release', icon: ShieldCheck },
      { to: '/rd-manager/pilots', label: 'Pilots & Launches', icon: Store },
      { to: '/rd-manager/impact', label: 'Impact Analysis', icon: GitBranch },
      { to: '/rd-manager/analytics', label: 'Sales & Analytics', icon: BarChart3 },
      { to: '/rd-manager/finance-ai', label: 'Finance & Cashflow', icon: TrendingUp },
      { to: '/rd-manager/sensory-lab', label: 'Sensory Lab', icon: Microscope },
      { to: '/rd-manager/compliance', label: 'Trace & Compliance', icon: FileSearch },
    ],
  },
  TRAINER: {
    label: 'Trainer',
    prefix: '/trainer',
    description: 'Author 7-module courses, manage question banks, run classes & attendance, and grade practicals.',
    nav: [
      dashboard('/trainer'),
      { to: '/trainer/courses', label: 'Courses & Quiz', icon: BookOpen },
      { to: '/trainer/question-bank', label: 'Question Bank', icon: HelpCircle },
      { to: '/trainer/classes', label: 'Classes & Attendance', icon: CalendarCheck },
      { to: '/trainer/assignments', label: 'Needs & Assignments', icon: GraduationCap },
      { to: '/trainer/assessments', label: 'Practical Grading', icon: ClipboardCheck },
      { to: '/trainer/my-learning', label: 'My Certifications', icon: Award },
      { to: '/trainer/sensory-lab', label: 'Sensory Lab', icon: Microscope },
    ],
  },
  TRAINING_MANAGER: {
    label: 'Training Manager',
    prefix: '/training-manager',
    description: 'Approve courses, govern training regulations, reset locked enrollments, and review effectiveness.',
    nav: [
      dashboard('/training-manager'),
      { to: '/training-manager/courses', label: 'Course Approvals', icon: ShieldCheck },
      { to: '/training-manager/regulations', label: 'Regulations', icon: Scale },
      { to: '/training-manager/enrollments', label: 'Enrollments & Needs', icon: GraduationCap },
      { to: '/training-manager/effectiveness', label: 'Course Effectiveness', icon: Activity },
    ],
  },
  QUALITY_AUDITOR: {
    label: 'Quality Auditor',
    prefix: '/quality-auditor',
    description: 'Conduct branch quality audits, upload evidence, manage corrective actions, and export compliance.',
    nav: [
      dashboard('/quality-auditor'),
      { to: '/quality-auditor/audits', label: 'Branch Audits', icon: ShieldCheck },
      { to: '/quality-auditor/corrective-actions', label: 'Corrective Actions', icon: AlertTriangle },
      { to: '/quality-auditor/compliance', label: 'Trace & Compliance', icon: FileSearch },
    ],
  },
  BRANCH_MANAGER: {
    label: 'Branch Manager',
    prefix: '/branch-manager',
    description: 'Monitor branch staff readiness, drink launches, daily sales & POS imports, and audit actions.',
    nav: [
      dashboard('/branch-manager'),
      { to: '/branch-manager/readiness', label: 'Staff Readiness', icon: Gauge },
      { to: '/branch-manager/launches', label: 'Drink Launches', icon: Store },
      { to: '/branch-manager/sales', label: 'Sales & POS Import', icon: ShoppingBag },
      { to: '/branch-manager/finance-ai', label: 'Finance & Cashflow', icon: TrendingUp },
      { to: '/branch-manager/quality', label: 'Branch Quality', icon: ShieldCheck },
    ],
  },
  TRAINEE: {
    label: 'Trainee / Barista',
    prefix: '/trainee',
    description: 'Complete course modules, pass theory quizzes and practical evaluations, and track your skill passport.',
    nav: [
      dashboard('/trainee'),
      { to: '/trainee/learning', label: 'My Learning', icon: BookOpen },
      { to: '/trainee/certificates', label: 'Certificates & Skills', icon: Award },
    ],
  },
}

export const dashboardPath = (role: Role) => `${roleConfig[role].prefix}/dashboard`
