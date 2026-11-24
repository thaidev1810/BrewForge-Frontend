export const ROLES = [
  'ADMIN',
  'RD_SPECIALIST',
  'RD_MANAGER',
  'TRAINER',
  'TRAINING_MANAGER',
  'QUALITY_AUDITOR',
  'BRANCH_MANAGER',
  'TRAINEE',
] as const

export type Role = (typeof ROLES)[number]

export interface User {
  id: string
  numericId?: number
  username?: string
  name: string
  email: string
  role: Role
  branchId: string | null
  numericBranchId?: number | null
  status?: string
  permissions?: string[]
}

export interface AuthSession {
  user: User
  accessToken: string
  refreshToken?: string | null
}

export interface LoginCredentials {
  username?: string
  email?: string
  password: string
}

export interface MeProfile {
  id: number
  username: string
  email: string
  fullName: string
  role: Role
  branchId: number | null
  status: 'ACTIVE' | 'INACTIVE'
  permissions: string[]
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthSession>
  refresh?(refreshToken: string): Promise<AuthSession>
  logout?(refreshToken?: string | null): Promise<void>
  me?(): Promise<MeProfile>
  changePassword?(currentPassword: string, newPassword: string): Promise<void>
}

export interface SeededAccount {
  username: string
  label: string
  role: Role
  branchCode?: string
}

export const DEV_SEED_PASSWORD = 'BrewForge@2026'

export const seededDevAccounts: SeededAccount[] = [
  { username: 'admin', label: 'Administrator (admin)', role: 'ADMIN' },
  { username: 'rdspec', label: 'R&D Specialist (rdspec)', role: 'RD_SPECIALIST' },
  { username: 'rdmanager', label: 'R&D Manager #1 (rdmanager)', role: 'RD_MANAGER' },
  { username: 'rdmanager2', label: 'R&D Manager #2 (rdmanager2 - BR-12 pair)', role: 'RD_MANAGER' },
  { username: 'trainer', label: 'Trainer (trainer)', role: 'TRAINER' },
  { username: 'trainingmgr', label: 'Training Manager (trainingmgr)', role: 'TRAINING_MANAGER' },
  { username: 'auditor', label: 'Quality Auditor (auditor)', role: 'QUALITY_AUDITOR' },
  { username: 'branchmgr', label: 'Branch Manager B01 (branchmgr)', role: 'BRANCH_MANAGER', branchCode: 'B01' },
  { username: 'branchmgr2', label: 'Branch Manager B02 (branchmgr2)', role: 'BRANCH_MANAGER', branchCode: 'B02' },
  { username: 'trainee', label: 'Trainee B01 #1 (trainee)', role: 'TRAINEE', branchCode: 'B01' },
  { username: 'trainee2', label: 'Trainee B01 #2 (trainee2)', role: 'TRAINEE', branchCode: 'B01' },
  { username: 'trainee3', label: 'Trainee B02 #1 (trainee3)', role: 'TRAINEE', branchCode: 'B02' },
  { username: 'trainee4', label: 'Trainee B02 #2 (trainee4)', role: 'TRAINEE', branchCode: 'B02' },
]
