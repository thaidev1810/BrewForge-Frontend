import type { Role } from '@/features/auth/authTypes'

export const roleConfig: Record<Role, { label: string; prefix: string; description: string }> = {
  ADMIN: { label: 'Administrator', prefix: '/admin', description: 'Manage access, branches, and the BrewForge workspace.' },
  RD_SPECIALIST: { label: 'R&D Specialist', prefix: '/rd-specialist', description: 'Develop beverages, recipes, and operating procedures.' },
  RD_MANAGER: { label: 'R&D Manager', prefix: '/rd-manager', description: 'Review development work and guide recipe standards.' },
  TRAINER: { label: 'Trainer', prefix: '/trainer', description: 'Prepare courses and support team learning.' },
  STORE_MANAGER: { label: 'Store Manager', prefix: '/store-manager', description: 'Coordinate branch training and team readiness.' },
  BARISTA: { label: 'Barista', prefix: '/barista', description: 'Build your beverage skills and follow trusted procedures.' },
  QUALITY_AUDITOR: { label: 'Quality Auditor', prefix: '/quality-auditor', description: 'Review branch quality and operating standards.' },
}
export const dashboardPath = (role: Role) => `${roleConfig[role].prefix}/dashboard`
