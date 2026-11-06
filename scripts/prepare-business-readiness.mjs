import fs from 'node:fs'
import crypto from 'node:crypto'
import { createServer } from 'vite'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { endpoints } = await server.ssrLoadModule('/src/services/backend/schema.ts')
  const { resources, reportPages } = await server.ssrLoadModule('/src/features/workspace/resources.ts')
  const { roleConfig } = await server.ssrLoadModule('/src/constants/roles.ts')
  const { navigationFor } = await server.ssrLoadModule('/src/constants/navigation.ts')
  const evidence = {
    'Recipes.List': 'Recipes/RecipeService.cs:21 ListAsync -> VersionFactsAsync (queries only)',
    'Recipes.Get': 'Recipes/RecipeService.cs:44 GetAsync -> VersionFactsAsync (queries only)',
    'Recipes.ListVersions': 'Recipes/RecipeService.cs:70 ListVersionsAsync (queries only)',
    'RecipeVersions.Get': 'Recipes/RecipeService.cs:134 GetVersionAsync -> RecipeQueries read/render',
    'Courses.List': 'Courses/CourseService.cs:34 ListAsync (queries only)',
    'Courses.Get': 'Courses/CourseService.cs:70 GetAsync -> CourseRenderer.RenderAsync (read/render)',
    'Courses.Modules': 'Courses/CourseService.cs:117 GetModulesAsync -> CourseRenderer.LoadSourceAsync',
    'Courses.GetQuiz': 'Courses/CourseService.cs:316 GetQuizAsync -> FindAsync (read only)',
    'Courses.ListQuestions': 'Courses/CourseService.cs:331 ListQuestionsAsync -> FindAsync',
    'Courses.EligibleTrainers': 'Courses/CourseService.cs:79 EligibleTrainersAsync (queries VALID certificate BR-34)',
    'Assignments.List': 'Training/AssignmentService.cs:60 ListAsync -> ToDtosAsync (queries only)',
    'Enrollments.Mine': 'Training/LearningService.cs:17 MyEnrollmentsAsync -> ToDtosAsync',
    'Enrollments.Get': 'Training/LearningService.cs:26 GetAsync -> FindAsync/ToDtosAsync (no save)',
    'Enrollments.Modules': 'Training/LearningService.cs:30 GetModulesAsync -> CourseRenderer (no save)',
    'Enrollments.Eligibility': 'Training/LearningService.cs:88 EligibilityAsync -> evaluator.LoadAsync/CheckEligibility (no save)',
    'Enrollments.Quiz': 'Training/AssessmentService.cs:71 GetQuizAsync (draws upcoming questions without persistence)',
    'Enrollments.QuizAttempts': 'Training/AssessmentService.cs:118 ListAttemptsAsync (read only)',
    'LearningPath.Mine': 'Training/LearningPathService.cs:124 MyPathAsync -> GetPathAsync -> LoadAsync tracking:false',
    'LearningPath.Get': 'Training/LearningPathService.cs:127 GetPathAsync -> LoadAsync tracking:false',
    'Certificates.Mine': 'Training/AssessmentService.cs:259 MyCertificatesAsync -> ToDtosAsync',
    'Certificates.Get': 'Training/AssessmentService.cs:265 GetCertificateAsync -> ToDtosAsync (owner guard)',
    'BranchAudits.List': 'Quality/QualityAuditService.cs:53 ListAsync -> ToDtosAsync',
    'BranchAudits.Get': 'Quality/QualityAuditService.cs:70 GetAsync -> ToDtosAsync',
    'BranchAudits.Evidence': 'Quality/EvidenceService.cs:40 OpenAsync -> storage.OpenRead; no write',
    'BranchAudits.Summary': 'Quality/QualityAuditService.cs:142 SummaryAsync (aggregate reads)',
    'BranchLaunchStatus.List': 'Launch/LaunchStatusService.cs:24 ListAsync -> ToDtosAsync; no EndDue/SaveChanges',
    'Dashboards.TrainingProgress': 'Dashboards/DashboardService.cs TrainingProgressAsync (aggregate reads)',
    'Dashboards.BranchPerformance': 'Dashboards/DashboardService.cs BranchPerformanceAsync (aggregate reads)',
    'QuestionBank.List': 'Training/QuestionBankService.cs ListAsync (query)',
    'QuestionBank.Get': 'Training/QuestionBankService.cs GetAsync (query)',
  }
  evidence['PracticalSchedules.ForEnrollment'] = 'Training/PracticalScheduleService.cs:46 ForEnrollmentAsync -> LearningService.FindAsync and query/ToDtosAsync; no write'
  evidence['Enrollments.PracticalVideos'] = 'Training/AssessmentService.cs:172 ListPracticalVideosAsync -> LearningService.FindAsync; metadata read only'
  const support = ['Users.List','UserLookup.Lookup','Roles.List','Branches.List','Branches.Get','Products.List','Ingredients.List','EquipmentClasses.List','Categories.List','Skills.Employees','Notifications.UnreadCount','Notifications.Inbox']
  for (const name of support) if (endpoints[name]) evidence[name] = 'Supporting read: controller -> matching query service; inspected no save in invoked read path'
  const safe = Object.entries(evidence).filter(([name]) => endpoints[name]?.method === 'GET').map(([name, proof]) => ({ operation: name, ...endpoints[name], evidence: proof }))
  const inventory = { roles: Object.entries(roleConfig).map(([role, config]) => ({ role, ...config, menu: navigationFor(role) })), resources, reportPages, endpoints, safe }
  fs.mkdirSync('e2e/fixtures', { recursive: true })
  fs.writeFileSync('e2e/fixtures/business-readiness.json', JSON.stringify(inventory, (_, value) => typeof value === 'function' ? undefined : value, 2) + '\n')
  const docs = ['docs/business-api-contracts.md','docs/implementation-plan.md','docs/implementation-status.md','../docs/demo-readiness.md','../docs/integration-gaps.md','../docs/page-function-guide.md']
  fs.mkdirSync('docs', { recursive: true })
  fs.writeFileSync('docs/business-readiness-source-review.md', '# Source review\n\nHistorical documents are not current wire contracts. Current controllers + service call paths and FE schema/router are primary implementation evidence. No approved SRS/product requirement file was found in the workspace.\n\n' + docs.map(path => {const data=fs.readFileSync(path);return `- ${path}: ${data.toString().split('\n').length} lines, SHA256 ${crypto.createHash('sha256').update(data).digest('hex')}. Reviewed for current updates, historical notices, gates and demo limitations.`}).join('\n') + '\n\n## GET allowlist\n\n' + safe.map(item=>`- ${item.operation}: GET ${item.path}; ${item.evidence}`).join('\n')+'\n\nPilot list/detail/readiness/evaluation are excluded: PilotService.ListAsync/FindAsync -> EndDueAsync -> state changes/audit/SaveChangesAsync. BranchLaunchStatus.List is a different, read-only branch-coverage view. Auth login/refresh/logout are the only allowed POST requests.\n')
  console.log(`Prepared ${safe.length} reviewed GET operations and ${inventory.roles.length} role inventories; no API requests made.`)
} finally { await server.close() }

