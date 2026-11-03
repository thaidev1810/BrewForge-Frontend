# Source review

Historical documents are not current wire contracts. Current controllers + service call paths and FE schema/router are primary implementation evidence. No approved SRS/product requirement file was found in the workspace.

- docs/business-api-contracts.md: 145 lines, SHA256 8b9d28af5834590dca899a73f39afd64b20315499dcb37ca726371454d5567db. Reviewed for current updates, historical notices, gates and demo limitations.
- docs/implementation-plan.md: 16 lines, SHA256 d232d01ca8c90f0a2841cac9611328438484a637b4f263d233c61ae03298f805. Reviewed for current updates, historical notices, gates and demo limitations.
- docs/implementation-status.md: 157 lines, SHA256 5bf74cc5d816dc6db5db9e2623c0b1ab72b7853ee442c88f109ed406ce6a5478. Reviewed for current updates, historical notices, gates and demo limitations.
- ../docs/demo-readiness.md: 302 lines, SHA256 ecaa59f25f286a74234555852afe45cb7ebceb662ba8a30f651e419f66306355. Reviewed for current updates, historical notices, gates and demo limitations.
- ../docs/integration-gaps.md: 280 lines, SHA256 82a20583c1a35a143510a9e897a0bf296ae81a4eba0db097a862c09049afc843. Reviewed for current updates, historical notices, gates and demo limitations.
- ../docs/page-function-guide.md: 1997 lines, SHA256 f14ce6ae3ade4428a0b23e105a15a9010287fd29ca1f37b1cc85d80c0d3e3c79. Reviewed for current updates, historical notices, gates and demo limitations.

## GET allowlist

- Recipes.List: GET /api/v1/recipes; Recipes/RecipeService.cs:21 ListAsync -> VersionFactsAsync (queries only)
- Recipes.Get: GET /api/v1/recipes/{id:long}; Recipes/RecipeService.cs:44 GetAsync -> VersionFactsAsync (queries only)
- Recipes.ListVersions: GET /api/v1/recipes/{id:long}/versions; Recipes/RecipeService.cs:70 ListVersionsAsync (queries only)
- RecipeVersions.Get: GET /api/v1/recipe-versions/{id:long}; Recipes/RecipeService.cs:134 GetVersionAsync -> RecipeQueries read/render
- Courses.List: GET /api/v1/courses; Courses/CourseService.cs:34 ListAsync (queries only)
- Courses.Get: GET /api/v1/courses/{id:long}; Courses/CourseService.cs:70 GetAsync -> CourseRenderer.RenderAsync (read/render)
- Courses.Modules: GET /api/v1/courses/{id:long}/modules; Courses/CourseService.cs:117 GetModulesAsync -> CourseRenderer.LoadSourceAsync
- Courses.GetQuiz: GET /api/v1/courses/{id:long}/quiz; Courses/CourseService.cs:316 GetQuizAsync -> FindAsync (read only)
- Courses.ListQuestions: GET /api/v1/courses/{id:long}/quiz/questions; Courses/CourseService.cs:331 ListQuestionsAsync -> FindAsync
- Courses.EligibleTrainers: GET /api/v1/courses/{id:long}/eligible-trainers; Courses/CourseService.cs:79 EligibleTrainersAsync (queries VALID certificate BR-34)
- Assignments.List: GET /api/v1/assignments; Training/AssignmentService.cs:60 ListAsync -> ToDtosAsync (queries only)
- Enrollments.Mine: GET /api/v1/me/enrollments; Training/LearningService.cs:17 MyEnrollmentsAsync -> ToDtosAsync
- Enrollments.Get: GET /api/v1/enrollments/{id:long}; Training/LearningService.cs:26 GetAsync -> FindAsync/ToDtosAsync (no save)
- Enrollments.Modules: GET /api/v1/enrollments/{id:long}/modules; Training/LearningService.cs:30 GetModulesAsync -> CourseRenderer (no save)
- Enrollments.Eligibility: GET /api/v1/enrollments/{id:long}/eligibility; Training/LearningService.cs:88 EligibilityAsync -> evaluator.LoadAsync/CheckEligibility (no save)
- Enrollments.Quiz: GET /api/v1/enrollments/{id:long}/quiz; Training/AssessmentService.cs:71 GetQuizAsync (draws upcoming questions without persistence)
- Enrollments.QuizAttempts: GET /api/v1/enrollments/{id:long}/quiz-attempts; Training/AssessmentService.cs:118 ListAttemptsAsync (read only)
- LearningPath.Mine: GET /api/v1/me/learning-path; Training/LearningPathService.cs:124 MyPathAsync -> GetPathAsync -> LoadAsync tracking:false
- LearningPath.Get: GET /api/v1/learning-paths/{userId:long}; Training/LearningPathService.cs:127 GetPathAsync -> LoadAsync tracking:false
- Certificates.Mine: GET /api/v1/me/certificates; Training/AssessmentService.cs:259 MyCertificatesAsync -> ToDtosAsync
- Certificates.Get: GET /api/v1/certificates/{id:long}; Training/AssessmentService.cs:265 GetCertificateAsync -> ToDtosAsync (owner guard)
- BranchAudits.List: GET /api/v1/branch-audits; Quality/QualityAuditService.cs:53 ListAsync -> ToDtosAsync
- BranchAudits.Get: GET /api/v1/branch-audits/{id:long}; Quality/QualityAuditService.cs:70 GetAsync -> ToDtosAsync
- BranchAudits.Evidence: GET /api/v1/branch-audits/evidence/{**key}; Quality/EvidenceService.cs:40 OpenAsync -> storage.OpenRead; no write
- BranchAudits.Summary: GET /api/v1/branch-audits/summary; Quality/QualityAuditService.cs:142 SummaryAsync (aggregate reads)
- BranchLaunchStatus.List: GET /api/v1/branch-launch-status; Launch/LaunchStatusService.cs:24 ListAsync -> ToDtosAsync; no EndDue/SaveChanges
- Dashboards.TrainingProgress: GET /api/v1/dashboards/training-progress; Dashboards/DashboardService.cs TrainingProgressAsync (aggregate reads)
- Dashboards.BranchPerformance: GET /api/v1/dashboards/branch-performance; Dashboards/DashboardService.cs BranchPerformanceAsync (aggregate reads)
- QuestionBank.List: GET /api/v1/question-bank; Training/QuestionBankService.cs ListAsync (query)
- QuestionBank.Get: GET /api/v1/question-bank/{id:long}; Training/QuestionBankService.cs GetAsync (query)
- PracticalSchedules.ForEnrollment: GET /api/v1/enrollments/{id:long}/practical-schedules; Training/PracticalScheduleService.cs:46 ForEnrollmentAsync -> LearningService.FindAsync and query/ToDtosAsync; no write
- Enrollments.PracticalVideos: GET /api/v1/enrollments/{id:long}/practical-videos; Training/AssessmentService.cs:172 ListPracticalVideosAsync -> LearningService.FindAsync; metadata read only
- Users.List: GET /api/v1/users; Supporting read: controller -> matching query service; inspected no save in invoked read path
- UserLookup.Lookup: GET /api/v1/users/lookup; Supporting read: controller -> matching query service; inspected no save in invoked read path
- Roles.List: GET /api/v1/roles; Supporting read: controller -> matching query service; inspected no save in invoked read path
- Branches.List: GET /api/v1/branches; Supporting read: controller -> matching query service; inspected no save in invoked read path
- Branches.Get: GET /api/v1/branches/{id:long}; Supporting read: controller -> matching query service; inspected no save in invoked read path
- Products.List: GET /api/v1/products; Supporting read: controller -> matching query service; inspected no save in invoked read path
- Ingredients.List: GET /api/v1/ingredients; Supporting read: controller -> matching query service; inspected no save in invoked read path
- EquipmentClasses.List: GET /api/v1/equipment-classes; Supporting read: controller -> matching query service; inspected no save in invoked read path
- Categories.List: GET /api/v1/categories; Supporting read: controller -> matching query service; inspected no save in invoked read path
- Skills.Employees: GET /api/v1/dashboards/employees; Supporting read: controller -> matching query service; inspected no save in invoked read path
- Notifications.UnreadCount: GET /api/v1/me/notifications/unread-count; Supporting read: controller -> matching query service; inspected no save in invoked read path
- Notifications.Inbox: GET /api/v1/me/notifications; Supporting read: controller -> matching query service; inspected no save in invoked read path

Pilot list/detail/readiness/evaluation are excluded: PilotService.ListAsync/FindAsync -> EndDueAsync -> state changes/audit/SaveChangesAsync. BranchLaunchStatus.List is a different, read-only branch-coverage view. Auth login/refresh/logout are the only allowed POST requests.
