// Generated request schemas and route metadata; business validations are in validation.ts.
export const schemas = {
  "ErrorEnvelope": [
    {
      "type": "string",
      "name": "code"
    },
    {
      "type": "string",
      "name": "message"
    },
    {
      "type": "string?",
      "name": "rule"
    },
    {
      "type": "IReadOnlyList<ErrorDetail>",
      "name": "details"
    },
    {
      "type": "string",
      "name": "traceId"
    }
  ],
  "AuditEntryDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long?",
      "name": "userId"
    },
    {
      "type": "string?",
      "name": "username"
    },
    {
      "type": "string",
      "name": "entityType"
    },
    {
      "type": "long",
      "name": "entityId"
    },
    {
      "type": "string",
      "name": "action"
    },
    {
      "type": "JsonElement?",
      "name": "payload"
    },
    {
      "type": "DateTimeOffset",
      "name": "createdAt"
    }
  ],
  "PersonDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "string",
      "name": "username"
    },
    {
      "type": "string",
      "name": "fullName"
    },
    {
      "type": "RoleName",
      "name": "role"
    }
  ],
  "TraceVersionDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "recipeId"
    },
    {
      "type": "string",
      "name": "recipeCode"
    },
    {
      "type": "string",
      "name": "recipeName"
    },
    {
      "type": "RecipeOrigin",
      "name": "origin"
    },
    {
      "type": "int",
      "name": "versionNo"
    },
    {
      "type": "VersionState",
      "name": "state"
    },
    {
      "type": "string?",
      "name": "contentHash"
    },
    {
      "type": "PersonDto?",
      "name": "author"
    },
    {
      "type": "PersonDto?",
      "name": "approver"
    },
    {
      "type": "DateTimeOffset?",
      "name": "releasedAt"
    },
    {
      "type": "DateTimeOffset?",
      "name": "supersededAt"
    }
  ],
  "TraceCheckDto": [
    {
      "type": "CheckType",
      "name": "checkType"
    },
    {
      "type": "bool",
      "name": "passed"
    },
    {
      "type": "int",
      "name": "violations"
    },
    {
      "type": "DateTimeOffset",
      "name": "runAt"
    }
  ],
  "TraceAiDraftDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "string",
      "name": "modelName"
    },
    {
      "type": "bool",
      "name": "schemaValid"
    },
    {
      "type": "DateTimeOffset",
      "name": "createdAt"
    },
    {
      "type": "string",
      "name": "promptText"
    }
  ],
  "TraceCourseDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "string",
      "name": "title"
    },
    {
      "type": "CourseType",
      "name": "courseType"
    },
    {
      "type": "CourseState",
      "name": "state"
    },
    {
      "type": "PersonDto?",
      "name": "createdBy"
    },
    {
      "type": "PersonDto?",
      "name": "approvedBy"
    },
    {
      "type": "DateTimeOffset?",
      "name": "publishedAt"
    }
  ],
  "TraceCertificateDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "userId"
    },
    {
      "type": "string?",
      "name": "username"
    },
    {
      "type": "string?",
      "name": "fullName"
    },
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "CertificateStatus",
      "name": "status"
    },
    {
      "type": "DateTimeOffset",
      "name": "issuedAt"
    }
  ],
  "TraceBranchDto": [
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "LaunchStatus",
      "name": "status"
    },
    {
      "type": "DateTimeOffset?",
      "name": "liveSince"
    },
    {
      "type": "int",
      "name": "certifiedCount"
    },
    {
      "type": "bool",
      "name": "coverageMet"
    }
  ],
  "VersionTraceDto": [
    {
      "type": "string",
      "name": "entityType"
    },
    {
      "type": "long",
      "name": "entityId"
    },
    {
      "type": "TraceVersionDto",
      "name": "version"
    },
    {
      "type": "IReadOnlyList<TraceCheckDto>",
      "name": "validation"
    },
    {
      "type": "IReadOnlyList<TraceAiDraftDto>",
      "name": "aiDrafts"
    },
    {
      "type": "IReadOnlyList<TraceCourseDto>",
      "name": "courses"
    },
    {
      "type": "IReadOnlyList<TraceCertificateDto>",
      "name": "certifiedStaff"
    },
    {
      "type": "IReadOnlyList<TraceBranchDto>",
      "name": "branches"
    },
    {
      "type": "int",
      "name": "cupsSold"
    },
    {
      "type": "IReadOnlyList<AuditEntryDto>",
      "name": "events"
    }
  ],
  "LoginRequest": [
    {
      "type": "string?",
      "name": "username"
    },
    {
      "type": "string?",
      "name": "password"
    }
  ],
  "RefreshRequest": [
    {
      "type": "string?",
      "name": "refreshToken"
    }
  ],
  "LoginResponse": [
    {
      "type": "string",
      "name": "accessToken"
    },
    {
      "type": "string",
      "name": "refreshToken"
    },
    {
      "type": "UserDto",
      "name": "user"
    }
  ],
  "MeResponse": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "string",
      "name": "username"
    },
    {
      "type": "string",
      "name": "email"
    },
    {
      "type": "string",
      "name": "fullName"
    },
    {
      "type": "RoleName",
      "name": "role"
    },
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "UserStatus",
      "name": "status"
    },
    {
      "type": "IReadOnlyList<string>",
      "name": "permissions"
    }
  ],
  "PagedResult": [
    {
      "type": "IReadOnlyList<T>",
      "name": "items"
    },
    {
      "type": "int",
      "name": "page"
    },
    {
      "type": "int",
      "name": "size"
    },
    {
      "type": "int",
      "name": "total"
    }
  ],
  "CourseDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "CourseType",
      "name": "courseType"
    },
    {
      "type": "string",
      "name": "title"
    },
    {
      "type": "int?",
      "name": "totalDurationMin"
    },
    {
      "type": "long",
      "name": "createdBy"
    },
    {
      "type": "long?",
      "name": "approvedBy"
    },
    {
      "type": "CourseState",
      "name": "state"
    },
    {
      "type": "DateTimeOffset?",
      "name": "publishedAt"
    },
    {
      "type": "long?",
      "name": "recipeId"
    },
    {
      "type": "string?",
      "name": "recipeCode"
    },
    {
      "type": "string?",
      "name": "recipeName"
    },
    {
      "type": "int?",
      "name": "versionNo"
    }
  ],
  "CourseDetailDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "CourseType",
      "name": "courseType"
    },
    {
      "type": "string",
      "name": "title"
    },
    {
      "type": "int?",
      "name": "totalDurationMin"
    },
    {
      "type": "long",
      "name": "createdBy"
    },
    {
      "type": "long?",
      "name": "approvedBy"
    },
    {
      "type": "CourseState",
      "name": "state"
    },
    {
      "type": "DateTimeOffset?",
      "name": "publishedAt"
    },
    {
      "type": "long?",
      "name": "recipeId"
    },
    {
      "type": "string?",
      "name": "recipeCode"
    },
    {
      "type": "string?",
      "name": "recipeName"
    },
    {
      "type": "int?",
      "name": "versionNo"
    },
    {
      "type": "IReadOnlyList<CourseModuleDto>",
      "name": "modules"
    },
    {
      "type": "QuizDto",
      "name": "quiz"
    },
    {
      "type": "IReadOnlyList<ChecklistItemDto>",
      "name": "practicalChecklist"
    }
  ],
  "CourseModuleDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "ModuleType",
      "name": "moduleType"
    },
    {
      "type": "int",
      "name": "moduleOrder"
    },
    {
      "type": "ModuleSource",
      "name": "source"
    },
    {
      "type": "int?",
      "name": "durationMinutes"
    },
    {
      "type": "ModuleState",
      "name": "state"
    },
    {
      "type": "IReadOnlyList<LessonDto>",
      "name": "lessons"
    }
  ],
  "LessonDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "int",
      "name": "lessonOrder"
    },
    {
      "type": "string",
      "name": "title"
    },
    {
      "type": "long?",
      "name": "recipeStepId"
    },
    {
      "type": "string?",
      "name": "content"
    },
    {
      "type": "string?",
      "name": "mediaUrl"
    },
    {
      "type": "bool",
      "name": "generated"
    },
    {
      "type": "object?",
      "name": "reference"
    }
  ],
  "QuizDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "string",
      "name": "title"
    },
    {
      "type": "int",
      "name": "passScore"
    },
    {
      "type": "int",
      "name": "questionCount"
    }
  ],
  "QuizQuestionDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "courseModuleId"
    },
    {
      "type": "ModuleType",
      "name": "moduleType"
    },
    {
      "type": "string",
      "name": "questionText"
    },
    {
      "type": "IReadOnlyList<QuizOption>",
      "name": "options"
    },
    {
      "type": "string",
      "name": "correctOption"
    }
  ],
  "ChecklistItemDto": [
    {
      "type": "long",
      "name": "lessonId"
    },
    {
      "type": "long?",
      "name": "recipeStepId"
    },
    {
      "type": "int",
      "name": "stepOrder"
    },
    {
      "type": "string",
      "name": "actionText"
    },
    {
      "type": "string?",
      "name": "techniqueGate"
    }
  ],
  "OverviewReference": [
    {
      "type": "string",
      "name": "recipeCode"
    },
    {
      "type": "string",
      "name": "recipeName"
    },
    {
      "type": "RecipeCategory",
      "name": "category"
    },
    {
      "type": "int",
      "name": "versionNo"
    },
    {
      "type": "int",
      "name": "stepCount"
    },
    {
      "type": "int",
      "name": "totalDurationSeconds"
    }
  ],
  "IngredientsReference": [
    {
      "type": "IReadOnlyList<IngredientReference>",
      "name": "ingredients"
    }
  ],
  "IngredientReference": [
    {
      "type": "string",
      "name": "ingredientCode"
    },
    {
      "type": "string",
      "name": "name"
    },
    {
      "type": "decimal",
      "name": "totalQuantity"
    },
    {
      "type": "string",
      "name": "unit"
    },
    {
      "type": "int",
      "name": "shelfLifeHours"
    },
    {
      "type": "string?",
      "name": "storageRule"
    },
    {
      "type": "CatalogStatus",
      "name": "status"
    },
    {
      "type": "IReadOnlyList<int>",
      "name": "usedInSteps"
    }
  ],
  "EquipmentListReference": [
    {
      "type": "IReadOnlyList<EquipmentReference>",
      "name": "equipment"
    }
  ],
  "EquipmentReference": [
    {
      "type": "string",
      "name": "equipmentClass"
    },
    {
      "type": "string?",
      "name": "equipmentCode"
    },
    {
      "type": "decimal?",
      "name": "minThreshold"
    },
    {
      "type": "decimal?",
      "name": "maxThreshold"
    },
    {
      "type": "DosingUnit?",
      "name": "dosingUnit"
    },
    {
      "type": "IReadOnlyList<int>",
      "name": "usedInSteps"
    }
  ],
  "StepReference": [
    {
      "type": "int",
      "name": "stepOrder"
    },
    {
      "type": "string",
      "name": "actionText"
    },
    {
      "type": "string?",
      "name": "equipmentClass"
    },
    {
      "type": "string?",
      "name": "techniqueGate"
    },
    {
      "type": "int?",
      "name": "durationSeconds"
    },
    {
      "type": "IReadOnlyList<StepIngredientReference>",
      "name": "ingredients"
    },
    {
      "type": "IReadOnlyList<int>",
      "name": "dependsOnSteps"
    }
  ],
  "StepIngredientReference": [
    {
      "type": "string",
      "name": "ingredientCode"
    },
    {
      "type": "string",
      "name": "name"
    },
    {
      "type": "decimal",
      "name": "quantity"
    },
    {
      "type": "string",
      "name": "unit"
    }
  ],
  "TechniqueGateReference": [
    {
      "type": "int",
      "name": "stepOrder"
    },
    {
      "type": "string",
      "name": "actionText"
    },
    {
      "type": "string?",
      "name": "techniqueGate"
    }
  ],
  "CreateCourseRequest": [
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "CourseType?",
      "name": "courseType"
    },
    {
      "type": "string?",
      "name": "title"
    }
  ],
  "UpdateModuleRequest": [
    {
      "type": "int?",
      "name": "durationMinutes"
    }
  ],
  "LessonRequest": [
    {
      "type": "string?",
      "name": "title"
    },
    {
      "type": "string?",
      "name": "content"
    },
    {
      "type": "string?",
      "name": "mediaUrl"
    }
  ],
  "QuizRequest": [
    {
      "type": "string?",
      "name": "title"
    },
    {
      "type": "int?",
      "name": "passScore"
    }
  ],
  "QuizQuestionRequest": [
    {
      "type": "long?",
      "name": "courseModuleId"
    },
    {
      "type": "string?",
      "name": "questionText"
    },
    {
      "type": "IReadOnlyList<QuizOptionRequest>?",
      "name": "options"
    },
    {
      "type": "string?",
      "name": "correctOption"
    }
  ],
  "QuizOptionRequest": [
    {
      "type": "string?",
      "name": "key"
    },
    {
      "type": "string?",
      "name": "text"
    }
  ],
  "ChecklistRequest": [
    {
      "type": "IReadOnlyList<ChecklistItemRequest>?",
      "name": "items"
    }
  ],
  "ChecklistItemRequest": [
    {
      "type": "long?",
      "name": "recipeStepId"
    }
  ],
  "ReturnCourseRequest": [
    {
      "type": "string?",
      "name": "comment"
    }
  ],
  "TrainingProgressRowDto": [
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "string",
      "name": "courseTitle"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "int",
      "name": "assigned"
    },
    {
      "type": "int",
      "name": "inProgress"
    },
    {
      "type": "int",
      "name": "eligible"
    },
    {
      "type": "int",
      "name": "passed"
    },
    {
      "type": "int",
      "name": "locked"
    },
    {
      "type": "int",
      "name": "overdue"
    },
    {
      "type": "int",
      "name": "certifiedValid"
    },
    {
      "type": "int",
      "name": "needsRecertification"
    }
  ],
  "BranchPerformanceRowDto": [
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "string?",
      "name": "branchName"
    },
    {
      "type": "long",
      "name": "recipeId"
    },
    {
      "type": "string?",
      "name": "recipeCode"
    },
    {
      "type": "string?",
      "name": "recipeName"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "int?",
      "name": "versionNo"
    },
    {
      "type": "LaunchStatus",
      "name": "status"
    },
    {
      "type": "DateTimeOffset?",
      "name": "liveSince"
    },
    {
      "type": "int",
      "name": "minCertifiedStaff"
    },
    {
      "type": "int",
      "name": "certifiedCount"
    },
    {
      "type": "bool",
      "name": "coverageMet"
    },
    {
      "type": "int",
      "name": "cupsTotal"
    },
    {
      "type": "int",
      "name": "tradingDays"
    },
    {
      "type": "decimal",
      "name": "cupsPerDay"
    },
    {
      "type": "DateOnly?",
      "name": "lastTradingDate"
    }
  ],
  "BranchPerformanceDto": [
    {
      "type": "DateOnly",
      "name": "from"
    },
    {
      "type": "DateOnly",
      "name": "to"
    },
    {
      "type": "IReadOnlyList<BranchPerformanceRowDto>",
      "name": "rows"
    }
  ],
  "CourseSalesBranchDto": [
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "int",
      "name": "certifiedStaff"
    },
    {
      "type": "int",
      "name": "cups"
    },
    {
      "type": "int",
      "name": "tradingDays"
    },
    {
      "type": "decimal",
      "name": "cupsPerDay"
    }
  ],
  "CourseEffectivenessDto": [
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "string",
      "name": "courseTitle"
    },
    {
      "type": "CourseType",
      "name": "courseType"
    },
    {
      "type": "CourseState",
      "name": "state"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "int",
      "name": "enrollments"
    },
    {
      "type": "int",
      "name": "passed"
    },
    {
      "type": "int",
      "name": "locked"
    },
    {
      "type": "int",
      "name": "firstAttempts"
    },
    {
      "type": "decimal?",
      "name": "firstAttemptPassRatePct"
    },
    {
      "type": "int",
      "name": "retakeAttempts"
    },
    {
      "type": "int",
      "name": "learnersWhoRetook"
    },
    {
      "type": "decimal?",
      "name": "attendanceRatePct"
    },
    {
      "type": "decimal?",
      "name": "avgDaysToCertification"
    },
    {
      "type": "decimal?",
      "name": "onTimeCompletionRatePct"
    },
    {
      "type": "IReadOnlyList<ModuleEffectiveness>",
      "name": "modules"
    },
    {
      "type": "int",
      "name": "cupsSold"
    },
    {
      "type": "IReadOnlyList<CourseSalesBranchDto>",
      "name": "salesByBranch"
    }
  ],
  "ImpactRequest": [
    {
      "type": "string?",
      "name": "entityType"
    },
    {
      "type": "long?",
      "name": "entityId"
    }
  ],
  "ImpactTriggerDto": [
    {
      "type": "string",
      "name": "entityType"
    },
    {
      "type": "long",
      "name": "entityId"
    }
  ],
  "AffectedCourseDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "ImpactType",
      "name": "impact"
    },
    {
      "type": "string?",
      "name": "title"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "CourseState?",
      "name": "state"
    }
  ],
  "AffectedCertificateDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "ImpactType",
      "name": "impact"
    },
    {
      "type": "long?",
      "name": "userId"
    },
    {
      "type": "string?",
      "name": "fullName"
    },
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "CertificateStatus?",
      "name": "status"
    }
  ],
  "AffectedBranchDto": [
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "long",
      "name": "recipeId"
    },
    {
      "type": "ImpactType",
      "name": "impact"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    }
  ],
  "AffectedDto": [
    {
      "type": "IReadOnlyList<long>",
      "name": "recipeVersions"
    },
    {
      "type": "IReadOnlyList<AffectedCourseDto>",
      "name": "courses"
    },
    {
      "type": "IReadOnlyList<AffectedCertificateDto>",
      "name": "certificates"
    },
    {
      "type": "IReadOnlyList<AffectedBranchDto>",
      "name": "liveBranches"
    }
  ],
  "ImpactWarningDto": [
    {
      "type": "string",
      "name": "code"
    },
    {
      "type": "string",
      "name": "message"
    }
  ],
  "ImpactAnalysisDto": [
    {
      "type": "string",
      "name": "runId"
    },
    {
      "type": "ImpactTriggerDto",
      "name": "trigger"
    },
    {
      "type": "AffectedDto",
      "name": "affected"
    },
    {
      "type": "bool",
      "name": "committed"
    },
    {
      "type": "ImpactWarningDto?",
      "name": "warning"
    }
  ],
  "BranchLaunchStatusDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "string?",
      "name": "branchName"
    },
    {
      "type": "long",
      "name": "recipeId"
    },
    {
      "type": "string?",
      "name": "recipeCode"
    },
    {
      "type": "string?",
      "name": "recipeName"
    },
    {
      "type": "RecipeOrigin?",
      "name": "origin"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "int?",
      "name": "versionNo"
    },
    {
      "type": "LaunchStatus",
      "name": "status"
    },
    {
      "type": "int",
      "name": "minCertifiedStaff"
    },
    {
      "type": "int",
      "name": "certifiedCount"
    },
    {
      "type": "bool",
      "name": "coverageMet"
    },
    {
      "type": "int",
      "name": "shortfall"
    },
    {
      "type": "DateTimeOffset?",
      "name": "liveSince"
    }
  ],
  "PilotCriterionRequest": [
    {
      "type": "CriterionType?",
      "name": "type"
    },
    {
      "type": "decimal?",
      "name": "cupsPerDayPerBranch"
    },
    {
      "type": "long?",
      "name": "controlRecipeId"
    },
    {
      "type": "decimal?",
      "name": "minPercentOfControl"
    },
    {
      "type": "decimal?",
      "name": "maxDropSecondHalfPct"
    }
  ],
  "PilotRequest": [
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "string?",
      "name": "name"
    },
    {
      "type": "DateOnly?",
      "name": "startDate"
    },
    {
      "type": "DateOnly?",
      "name": "endDate"
    },
    {
      "type": "int?",
      "name": "minCertifiedStaff"
    },
    {
      "type": "IReadOnlyList<long>?",
      "name": "branchIds"
    },
    {
      "type": "IReadOnlyList<PilotCriterionRequest>?",
      "name": "criteria"
    }
  ],
  "DecisionRequest": [
    {
      "type": "LaunchDecisionType?",
      "name": "decision"
    },
    {
      "type": "string?",
      "name": "note"
    }
  ],
  "PilotBranchDto": [
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "string?",
      "name": "branchName"
    },
    {
      "type": "PilotBranchState",
      "name": "readinessState"
    },
    {
      "type": "DateTimeOffset?",
      "name": "wentLiveAt"
    }
  ],
  "LaunchDecisionDto": [
    {
      "type": "LaunchDecisionType",
      "name": "decision"
    },
    {
      "type": "long",
      "name": "decidedBy"
    },
    {
      "type": "DateTimeOffset",
      "name": "decidedAt"
    },
    {
      "type": "JsonElement",
      "name": "evaluated"
    }
  ],
  "PilotDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "recipeVersionId"
    },
    {
      "type": "long",
      "name": "recipeId"
    },
    {
      "type": "string",
      "name": "recipeCode"
    },
    {
      "type": "string",
      "name": "recipeName"
    },
    {
      "type": "int",
      "name": "versionNo"
    },
    {
      "type": "string",
      "name": "name"
    },
    {
      "type": "DateOnly",
      "name": "startDate"
    },
    {
      "type": "DateOnly",
      "name": "endDate"
    },
    {
      "type": "int",
      "name": "minCertifiedStaff"
    },
    {
      "type": "PilotState",
      "name": "state"
    },
    {
      "type": "long",
      "name": "createdBy"
    },
    {
      "type": "IReadOnlyList<PilotCriterion>",
      "name": "criteria"
    },
    {
      "type": "IReadOnlyList<PilotBranchDto>",
      "name": "branches"
    },
    {
      "type": "LaunchDecisionDto?",
      "name": "decision"
    }
  ],
  "BranchReadinessDto": [
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "PilotBranchState",
      "name": "readinessState"
    },
    {
      "type": "int",
      "name": "certifiedCount"
    },
    {
      "type": "int",
      "name": "minCertifiedStaff"
    },
    {
      "type": "bool",
      "name": "coverageMet"
    },
    {
      "type": "LaunchStatus?",
      "name": "launchStatus"
    },
    {
      "type": "long?",
      "name": "liveVersionId"
    },
    {
      "type": "DateTimeOffset?",
      "name": "wentLiveAt"
    }
  ],
  "PilotReadinessDto": [
    {
      "type": "long",
      "name": "pilotId"
    },
    {
      "type": "PilotState",
      "name": "state"
    },
    {
      "type": "long",
      "name": "recipeVersionId"
    },
    {
      "type": "int",
      "name": "minCertifiedStaff"
    },
    {
      "type": "IReadOnlyList<BranchReadinessDto>",
      "name": "branches"
    }
  ],
  "BranchDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "string",
      "name": "branchCode"
    },
    {
      "type": "string",
      "name": "name"
    },
    {
      "type": "string?",
      "name": "address"
    },
    {
      "type": "BranchStatus",
      "name": "status"
    }
  ],
  "BranchRequest": [
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "string?",
      "name": "name"
    },
    {
      "type": "string?",
      "name": "address"
    },
    {
      "type": "BranchStatus?",
      "name": "status"
    }
  ],
  "CategoryDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "CategoryKind",
      "name": "kind"
    },
    {
      "type": "string",
      "name": "code"
    },
    {
      "type": "string",
      "name": "name"
    },
    {
      "type": "CatalogStatus",
      "name": "status"
    }
  ],
  "CategoryRequest": [
    {
      "type": "CategoryKind?",
      "name": "kind"
    },
    {
      "type": "string?",
      "name": "code"
    },
    {
      "type": "string?",
      "name": "name"
    },
    {
      "type": "CatalogStatus?",
      "name": "status"
    }
  ],
  "EquipmentClassDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "string",
      "name": "equipmentCode"
    },
    {
      "type": "string",
      "name": "equipmentClass"
    },
    {
      "type": "decimal",
      "name": "minThreshold"
    },
    {
      "type": "decimal",
      "name": "maxThreshold"
    },
    {
      "type": "DosingUnit",
      "name": "dosingUnit"
    },
    {
      "type": "CatalogStatus",
      "name": "status"
    }
  ],
  "EquipmentClassRequest": [
    {
      "type": "string?",
      "name": "equipmentCode"
    },
    {
      "type": "string?",
      "name": "equipmentClass"
    },
    {
      "type": "decimal?",
      "name": "minThreshold"
    },
    {
      "type": "decimal?",
      "name": "maxThreshold"
    },
    {
      "type": "DosingUnit?",
      "name": "dosingUnit"
    },
    {
      "type": "CatalogStatus?",
      "name": "status"
    }
  ],
  "IngredientDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "string",
      "name": "ingredientCode"
    },
    {
      "type": "string",
      "name": "name"
    },
    {
      "type": "IngredientUnit",
      "name": "unit"
    },
    {
      "type": "int",
      "name": "shelfLifeHours"
    },
    {
      "type": "string?",
      "name": "storageRule"
    },
    {
      "type": "CatalogStatus",
      "name": "status"
    }
  ],
  "IngredientRequest": [
    {
      "type": "string?",
      "name": "ingredientCode"
    },
    {
      "type": "string?",
      "name": "name"
    },
    {
      "type": "IngredientUnit?",
      "name": "unit"
    },
    {
      "type": "int?",
      "name": "shelfLifeHours"
    },
    {
      "type": "string?",
      "name": "storageRule"
    },
    {
      "type": "CatalogStatus?",
      "name": "status"
    }
  ],
  "ProductDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "string",
      "name": "productCode"
    },
    {
      "type": "string",
      "name": "name"
    },
    {
      "type": "long?",
      "name": "categoryId"
    },
    {
      "type": "string?",
      "name": "categoryName"
    },
    {
      "type": "long?",
      "name": "recipeId"
    },
    {
      "type": "string?",
      "name": "recipeCode"
    },
    {
      "type": "long?",
      "name": "currentVersionId"
    },
    {
      "type": "int?",
      "name": "currentVersionNo"
    },
    {
      "type": "string?",
      "name": "description"
    },
    {
      "type": "string?",
      "name": "imageUrl"
    },
    {
      "type": "CatalogStatus",
      "name": "status"
    }
  ],
  "ProductRequest": [
    {
      "type": "string?",
      "name": "productCode"
    },
    {
      "type": "string?",
      "name": "name"
    },
    {
      "type": "long?",
      "name": "categoryId"
    },
    {
      "type": "long?",
      "name": "recipeId"
    },
    {
      "type": "string?",
      "name": "description"
    },
    {
      "type": "string?",
      "name": "imageUrl"
    },
    {
      "type": "CatalogStatus?",
      "name": "status"
    }
  ],
  "SettingDto": [
    {
      "type": "string",
      "name": "key"
    },
    {
      "type": "string",
      "name": "value"
    },
    {
      "type": "DateTimeOffset",
      "name": "updatedAt"
    },
    {
      "type": "long?",
      "name": "updatedBy"
    }
  ],
  "SettingRequest": [
    {
      "type": "string?",
      "name": "value"
    }
  ],
  "PushSubscriptionRequest": [
    {
      "type": "string?",
      "name": "endpoint"
    },
    {
      "type": "PushSubscriptionKeys?",
      "name": "keys"
    }
  ],
  "PushSubscriptionKeys": [
    {
      "type": "string?",
      "name": "p256dh"
    },
    {
      "type": "string?",
      "name": "auth"
    }
  ],
  "PushSubscriptionDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "string",
      "name": "endpoint"
    },
    {
      "type": "DateTimeOffset",
      "name": "createdAt"
    }
  ],
  "PushConfigDto": [
    {
      "type": "bool",
      "name": "enabled"
    },
    {
      "type": "string?",
      "name": "publicKey"
    }
  ],
  "CorrectiveActionDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "branchAuditId"
    },
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "string",
      "name": "description"
    },
    {
      "type": "bool",
      "name": "retrainingRequired"
    },
    {
      "type": "IReadOnlyList<long>",
      "name": "employeeIds"
    },
    {
      "type": "CorrectiveActionStatus",
      "name": "status"
    },
    {
      "type": "DateOnly?",
      "name": "dueDate"
    },
    {
      "type": "DateTimeOffset",
      "name": "createdAt"
    },
    {
      "type": "DateTimeOffset?",
      "name": "closedAt"
    },
    {
      "type": "long?",
      "name": "closedBy"
    },
    {
      "type": "string?",
      "name": "closureNote"
    }
  ],
  "CloseCorrectiveActionRequest": [
    {
      "type": "string?",
      "name": "note"
    }
  ],
  "RetrainingRequest": [
    {
      "type": "long?",
      "name": "courseId"
    },
    {
      "type": "DateOnly?",
      "name": "deadline"
    }
  ],
  "EvidenceDto": [
    {
      "type": "string",
      "name": "key"
    },
    {
      "type": "string",
      "name": "url"
    },
    {
      "type": "long",
      "name": "sizeBytes"
    }
  ],
  "AuditItemDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "string",
      "name": "criterion"
    },
    {
      "type": "string?",
      "name": "expected"
    },
    {
      "type": "string?",
      "name": "actual"
    },
    {
      "type": "bool",
      "name": "passed"
    },
    {
      "type": "bool",
      "name": "critical"
    },
    {
      "type": "string?",
      "name": "comment"
    },
    {
      "type": "string?",
      "name": "evidenceUrl"
    }
  ],
  "BranchAuditDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "string?",
      "name": "branchName"
    },
    {
      "type": "long",
      "name": "recipeVersionId"
    },
    {
      "type": "long",
      "name": "recipeId"
    },
    {
      "type": "string?",
      "name": "recipeCode"
    },
    {
      "type": "string?",
      "name": "recipeName"
    },
    {
      "type": "int",
      "name": "versionNo"
    },
    {
      "type": "long",
      "name": "auditorId"
    },
    {
      "type": "string?",
      "name": "auditorName"
    },
    {
      "type": "DateTimeOffset",
      "name": "auditedAt"
    },
    {
      "type": "int",
      "name": "score"
    },
    {
      "type": "AuditResult",
      "name": "result"
    },
    {
      "type": "string?",
      "name": "comment"
    },
    {
      "type": "IReadOnlyList<AuditItemDto>",
      "name": "items"
    },
    {
      "type": "long?",
      "name": "correctiveActionId"
    }
  ],
  "BranchAuditRequest": [
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "string?",
      "name": "comment"
    },
    {
      "type": "IReadOnlyList<AuditItemRequest>?",
      "name": "items"
    },
    {
      "type": "bool?",
      "name": "retrainingRequired"
    },
    {
      "type": "IReadOnlyList<long>?",
      "name": "employeeIds"
    },
    {
      "type": "DateOnly?",
      "name": "dueDate"
    }
  ],
  "AuditItemRequest": [
    {
      "type": "string?",
      "name": "criterion"
    },
    {
      "type": "string?",
      "name": "expected"
    },
    {
      "type": "string?",
      "name": "actual"
    },
    {
      "type": "bool?",
      "name": "passed"
    },
    {
      "type": "bool?",
      "name": "critical"
    },
    {
      "type": "string?",
      "name": "comment"
    },
    {
      "type": "string?",
      "name": "evidenceUrl"
    }
  ],
  "BranchComplianceDto": [
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "string?",
      "name": "branchName"
    },
    {
      "type": "int",
      "name": "audits"
    },
    {
      "type": "int",
      "name": "averageScore"
    }
  ],
  "AuditSummaryDto": [
    {
      "type": "DateOnly",
      "name": "from"
    },
    {
      "type": "DateOnly",
      "name": "to"
    },
    {
      "type": "int",
      "name": "audits"
    },
    {
      "type": "int",
      "name": "passed"
    },
    {
      "type": "int",
      "name": "failed"
    },
    {
      "type": "int",
      "name": "openCorrectiveActions"
    },
    {
      "type": "BranchComplianceDto?",
      "name": "lowestCompliance"
    },
    {
      "type": "IReadOnlyList<BranchComplianceDto>",
      "name": "branches"
    }
  ],
  "RecipeDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "string",
      "name": "recipeCode"
    },
    {
      "type": "string",
      "name": "name"
    },
    {
      "type": "RecipeCategory",
      "name": "category"
    },
    {
      "type": "RecipeOrigin",
      "name": "origin"
    },
    {
      "type": "RecipeStatus",
      "name": "status"
    },
    {
      "type": "long",
      "name": "createdBy"
    },
    {
      "type": "DateTimeOffset",
      "name": "createdAt"
    },
    {
      "type": "long?",
      "name": "releasedVersionId"
    },
    {
      "type": "int?",
      "name": "releasedVersionNo"
    },
    {
      "type": "int",
      "name": "versionCount"
    }
  ],
  "CreateRecipeRequest": [
    {
      "type": "string?",
      "name": "recipeCode"
    },
    {
      "type": "string?",
      "name": "name"
    },
    {
      "type": "RecipeCategory?",
      "name": "category"
    },
    {
      "type": "RecipeOrigin?",
      "name": "origin"
    }
  ],
  "RecipeVersionSummaryDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "recipeId"
    },
    {
      "type": "int",
      "name": "versionNo"
    },
    {
      "type": "VersionState",
      "name": "state"
    },
    {
      "type": "bool",
      "name": "isImmutable"
    },
    {
      "type": "long",
      "name": "createdBy"
    },
    {
      "type": "long?",
      "name": "approvedBy"
    },
    {
      "type": "DateTimeOffset?",
      "name": "releasedAt"
    },
    {
      "type": "DateTimeOffset?",
      "name": "supersededAt"
    },
    {
      "type": "int",
      "name": "stepCount"
    },
    {
      "type": "bool?",
      "name": "lastValidationPassed"
    },
    {
      "type": "DateTimeOffset?",
      "name": "lastValidatedAt"
    }
  ],
  "CreateVersionRequest": [
    {
      "type": "long?",
      "name": "copyFromVersionId"
    }
  ],
  "RecipeVersionDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "recipeId"
    },
    {
      "type": "int",
      "name": "versionNo"
    },
    {
      "type": "VersionState",
      "name": "state"
    },
    {
      "type": "bool",
      "name": "isImmutable"
    },
    {
      "type": "string?",
      "name": "contentHash"
    },
    {
      "type": "long",
      "name": "createdBy"
    },
    {
      "type": "long?",
      "name": "approvedBy"
    },
    {
      "type": "DateTimeOffset?",
      "name": "releasedAt"
    },
    {
      "type": "DateTimeOffset?",
      "name": "supersededAt"
    },
    {
      "type": "IReadOnlyList<StepDto>",
      "name": "steps"
    }
  ],
  "StepDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "int",
      "name": "stepOrder"
    },
    {
      "type": "string",
      "name": "actionText"
    },
    {
      "type": "string?",
      "name": "equipmentClass"
    },
    {
      "type": "string?",
      "name": "techniqueGate"
    },
    {
      "type": "int?",
      "name": "durationSeconds"
    },
    {
      "type": "IReadOnlyList<StepIngredientDto>",
      "name": "ingredients"
    },
    {
      "type": "IReadOnlyList<StepDependencyDto>",
      "name": "dependsOn"
    }
  ],
  "StepIngredientDto": [
    {
      "type": "long",
      "name": "ingredientId"
    },
    {
      "type": "string?",
      "name": "ingredientCode"
    },
    {
      "type": "string?",
      "name": "ingredientName"
    },
    {
      "type": "decimal",
      "name": "quantity"
    },
    {
      "type": "string",
      "name": "unit"
    }
  ],
  "StepDependencyDto": [
    {
      "type": "long",
      "name": "stepId"
    },
    {
      "type": "int",
      "name": "stepOrder"
    },
    {
      "type": "DependencyType",
      "name": "type"
    }
  ],
  "RecipeContentRequest": [
    {
      "type": "IReadOnlyList<StepRequest>?",
      "name": "steps"
    }
  ],
  "StepRequest": [
    {
      "type": "int?",
      "name": "stepOrder"
    },
    {
      "type": "string?",
      "name": "actionText"
    },
    {
      "type": "string?",
      "name": "equipmentClass"
    },
    {
      "type": "string?",
      "name": "techniqueGate"
    },
    {
      "type": "int?",
      "name": "durationSeconds"
    },
    {
      "type": "IReadOnlyList<StepIngredientRequest>?",
      "name": "ingredients"
    },
    {
      "type": "IReadOnlyList<StepDependencyRequest>?",
      "name": "dependsOn"
    }
  ],
  "StepIngredientRequest": [
    {
      "type": "long?",
      "name": "ingredientId"
    },
    {
      "type": "string?",
      "name": "ingredientCode"
    },
    {
      "type": "decimal?",
      "name": "quantity"
    },
    {
      "type": "string?",
      "name": "unit"
    }
  ],
  "StepDependencyRequest": [
    {
      "type": "int?",
      "name": "stepOrder"
    },
    {
      "type": "long?",
      "name": "stepId"
    },
    {
      "type": "DependencyType?",
      "name": "type"
    }
  ],
  "ValidationResultDto": [
    {
      "type": "long",
      "name": "versionId"
    },
    {
      "type": "bool",
      "name": "passed"
    },
    {
      "type": "DateTimeOffset",
      "name": "runAt"
    },
    {
      "type": "IReadOnlyList<CheckDto>",
      "name": "checks"
    }
  ],
  "CheckDto": [
    {
      "type": "CheckType",
      "name": "checkType"
    },
    {
      "type": "bool",
      "name": "passed"
    },
    {
      "type": "IReadOnlyList<ViolationDto>",
      "name": "violations"
    }
  ],
  "ViolationDto": [
    {
      "type": "long?",
      "name": "stepId"
    },
    {
      "type": "int?",
      "name": "stepOrder"
    },
    {
      "type": "string",
      "name": "rule"
    },
    {
      "type": "string?",
      "name": "code"
    },
    {
      "type": "string",
      "name": "message"
    },
    {
      "type": "string",
      "name": "expected"
    },
    {
      "type": "string",
      "name": "actual"
    }
  ],
  "GenerateDraftRequest": [
    {
      "type": "string?",
      "name": "description"
    }
  ],
  "RepairRequest": [
    {
      "type": "RepairMode?",
      "name": "mode"
    },
    {
      "type": "RecipeContentRequest?",
      "name": "patch"
    }
  ],
  "DraftResultDto": [
    {
      "type": "RecipeVersionDto",
      "name": "version"
    },
    {
      "type": "ValidationResultDto",
      "name": "validation"
    },
    {
      "type": "string?",
      "name": "notes"
    },
    {
      "type": "int?",
      "name": "servingSizeMl"
    },
    {
      "type": "int",
      "name": "aiRepairsUsed"
    },
    {
      "type": "int",
      "name": "aiRepairsLeft"
    }
  ],
  "ReviewRequest": [
    {
      "type": "IReadOnlyList<StepDecisionRequest>?",
      "name": "decisions"
    }
  ],
  "StepDecisionRequest": [
    {
      "type": "long?",
      "name": "stepId"
    },
    {
      "type": "ReviewAction?",
      "name": "action"
    },
    {
      "type": "string?",
      "name": "editedText"
    }
  ],
  "ReviewResultDto": [
    {
      "type": "ReviewOutcome",
      "name": "outcome"
    },
    {
      "type": "RecipeVersionDto",
      "name": "version"
    }
  ],
  "ReleaseResultDto": [
    {
      "type": "RecipeVersionDto",
      "name": "version"
    },
    {
      "type": "long?",
      "name": "supersededVersionId"
    },
    {
      "type": "bool",
      "name": "replayed"
    }
  ],
  "ImportExistingRecipeRequest": [
    {
      "type": "string?",
      "name": "recipeCode"
    },
    {
      "type": "string?",
      "name": "name"
    },
    {
      "type": "RecipeCategory?",
      "name": "category"
    },
    {
      "type": "IReadOnlyList<StepRequest>?",
      "name": "steps"
    }
  ],
  "ImportedRecipeDto": [
    {
      "type": "RecipeDto",
      "name": "recipe"
    },
    {
      "type": "RecipeVersionDto",
      "name": "version"
    },
    {
      "type": "ValidationResultDto",
      "name": "validation"
    }
  ],
  "PosImportResultDto": [
    {
      "type": "string",
      "name": "jobId"
    },
    {
      "type": "string",
      "name": "fileName"
    },
    {
      "type": "int",
      "name": "accepted"
    },
    {
      "type": "int",
      "name": "rejected"
    },
    {
      "type": "int",
      "name": "replaced"
    },
    {
      "type": "IReadOnlyList<PosRowError>",
      "name": "errors"
    },
    {
      "type": "DateTimeOffset",
      "name": "importedAt"
    },
    {
      "type": "bool",
      "name": "replayed"
    }
  ],
  "SalesGroupDto": [
    {
      "type": "string",
      "name": "key"
    },
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "DateOnly",
      "name": "from"
    },
    {
      "type": "DateOnly",
      "name": "to"
    },
    {
      "type": "int",
      "name": "cups"
    },
    {
      "type": "int",
      "name": "tradingDays"
    },
    {
      "type": "decimal",
      "name": "cupsPerDay"
    },
    {
      "type": "decimal?",
      "name": "changePct"
    },
    {
      "type": "int?",
      "name": "controlCups"
    },
    {
      "type": "decimal?",
      "name": "percentOfControl"
    }
  ],
  "SalesAggregateDto": [
    {
      "type": "long",
      "name": "recipeId"
    },
    {
      "type": "string",
      "name": "recipeCode"
    },
    {
      "type": "string",
      "name": "recipeName"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "SalesGrouping",
      "name": "groupBy"
    },
    {
      "type": "DateOnly?",
      "name": "from"
    },
    {
      "type": "DateOnly?",
      "name": "to"
    },
    {
      "type": "int",
      "name": "totalCups"
    },
    {
      "type": "int",
      "name": "tradingDays"
    },
    {
      "type": "decimal",
      "name": "cupsPerDay"
    },
    {
      "type": "long?",
      "name": "controlRecipeId"
    },
    {
      "type": "string?",
      "name": "controlRecipeCode"
    },
    {
      "type": "int?",
      "name": "controlCups"
    },
    {
      "type": "decimal?",
      "name": "percentOfControl"
    },
    {
      "type": "IReadOnlyList<SalesGroupDto>",
      "name": "groups"
    }
  ],
  "SalesRecordDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "long",
      "name": "recipeId"
    },
    {
      "type": "string?",
      "name": "recipeCode"
    },
    {
      "type": "string?",
      "name": "recipeName"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "int?",
      "name": "versionNo"
    },
    {
      "type": "DateOnly",
      "name": "tradingDate"
    },
    {
      "type": "int",
      "name": "cupsSold"
    },
    {
      "type": "SalesSource",
      "name": "source"
    },
    {
      "type": "long",
      "name": "recordedBy"
    },
    {
      "type": "DateTimeOffset",
      "name": "recordedAt"
    }
  ],
  "SalesRecordRequest": [
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "long?",
      "name": "recipeId"
    },
    {
      "type": "DateOnly?",
      "name": "tradingDate"
    },
    {
      "type": "int?",
      "name": "cupsSold"
    }
  ],
  "SalesCorrectionRequest": [
    {
      "type": "int?",
      "name": "cupsSold"
    }
  ],
  "SellableDrinkDto": [
    {
      "type": "long",
      "name": "recipeId"
    },
    {
      "type": "string",
      "name": "recipeCode"
    },
    {
      "type": "string",
      "name": "name"
    },
    {
      "type": "RecipeCategory",
      "name": "category"
    },
    {
      "type": "long",
      "name": "recipeVersionId"
    },
    {
      "type": "int?",
      "name": "versionNo"
    },
    {
      "type": "bool",
      "name": "coverageMet"
    }
  ],
  "LearnerQuestionDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "courseModuleId"
    },
    {
      "type": "ModuleType",
      "name": "moduleType"
    },
    {
      "type": "string",
      "name": "questionText"
    },
    {
      "type": "IReadOnlyList<QuizOption>",
      "name": "options"
    }
  ],
  "LearnerQuizDto": [
    {
      "type": "long",
      "name": "quizId"
    },
    {
      "type": "string",
      "name": "title"
    },
    {
      "type": "int",
      "name": "passScore"
    },
    {
      "type": "int",
      "name": "retakesLeft"
    },
    {
      "type": "IReadOnlyList<LearnerQuestionDto>",
      "name": "questions"
    }
  ],
  "QuizAttemptRequest": [
    {
      "type": "IReadOnlyList<QuizAnswerRequest>?",
      "name": "answers"
    }
  ],
  "QuizAnswerRequest": [
    {
      "type": "long?",
      "name": "questionId"
    },
    {
      "type": "string?",
      "name": "selectedOption"
    }
  ],
  "ModuleScoreDto": [
    {
      "type": "ModuleType",
      "name": "moduleType"
    },
    {
      "type": "int",
      "name": "correct"
    },
    {
      "type": "int",
      "name": "total"
    }
  ],
  "QuizAttemptResultDto": [
    {
      "type": "int",
      "name": "attemptNo"
    },
    {
      "type": "int",
      "name": "score"
    },
    {
      "type": "bool",
      "name": "passed"
    },
    {
      "type": "int",
      "name": "passScore"
    },
    {
      "type": "int",
      "name": "retakesLeft"
    },
    {
      "type": "EnrollmentState",
      "name": "enrollmentState"
    },
    {
      "type": "IReadOnlyList<ModuleScoreDto>",
      "name": "perModule"
    },
    {
      "type": "DateTimeOffset",
      "name": "attemptedAt"
    },
    {
      "type": "long?",
      "name": "certificateId"
    }
  ],
  "PracticalVideoDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "enrollmentId"
    },
    {
      "type": "long",
      "name": "uploadedBy"
    },
    {
      "type": "string",
      "name": "fileName"
    },
    {
      "type": "string",
      "name": "contentType"
    },
    {
      "type": "long",
      "name": "sizeBytes"
    },
    {
      "type": "string",
      "name": "sha256"
    },
    {
      "type": "DateTimeOffset",
      "name": "uploadedAt"
    },
    {
      "type": "long?",
      "name": "evaluationId"
    }
  ],
  "PracticalEvaluationRequest": [
    {
      "type": "long?",
      "name": "practicalVideoId"
    },
    {
      "type": "IReadOnlyList<ChecklistMarkRequest>?",
      "name": "items"
    }
  ],
  "ChecklistMarkRequest": [
    {
      "type": "long?",
      "name": "recipeStepId"
    },
    {
      "type": "long?",
      "name": "lessonId"
    },
    {
      "type": "bool?",
      "name": "passed"
    },
    {
      "type": "string?",
      "name": "note"
    }
  ],
  "PracticalEvaluationDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "enrollmentId"
    },
    {
      "type": "long",
      "name": "evaluatedBy"
    },
    {
      "type": "bool",
      "name": "passed"
    },
    {
      "type": "DateTimeOffset",
      "name": "evaluatedAt"
    },
    {
      "type": "IReadOnlyList<ChecklistMark>",
      "name": "items"
    },
    {
      "type": "long?",
      "name": "practicalVideoId"
    },
    {
      "type": "EnrollmentState",
      "name": "enrollmentState"
    },
    {
      "type": "long?",
      "name": "certificateId"
    }
  ],
  "CertificateDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "userId"
    },
    {
      "type": "string",
      "name": "fullName"
    },
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "string",
      "name": "courseTitle"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "string?",
      "name": "recipeCode"
    },
    {
      "type": "string?",
      "name": "recipeName"
    },
    {
      "type": "int?",
      "name": "versionNo"
    },
    {
      "type": "DateTimeOffset",
      "name": "issuedAt"
    },
    {
      "type": "CertificateStatus",
      "name": "status"
    },
    {
      "type": "long?",
      "name": "supersededBy"
    }
  ],
  "AssignmentRequest": [
    {
      "type": "long?",
      "name": "courseId"
    },
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "IReadOnlyList<long>?",
      "name": "employeeIds"
    },
    {
      "type": "bool?",
      "name": "allTrainees"
    },
    {
      "type": "DateOnly?",
      "name": "deadline"
    },
    {
      "type": "string?",
      "name": "reason"
    }
  ],
  "AssignmentResultDto": [
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "IReadOnlyList<long>",
      "name": "enrollmentIds"
    },
    {
      "type": "IReadOnlyList<long>",
      "name": "alreadyEnrolled"
    }
  ],
  "AssignmentDto": [
    {
      "type": "long",
      "name": "enrollmentId"
    },
    {
      "type": "long",
      "name": "userId"
    },
    {
      "type": "string?",
      "name": "fullName"
    },
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "string",
      "name": "courseTitle"
    },
    {
      "type": "DateOnly?",
      "name": "dueDate"
    },
    {
      "type": "int",
      "name": "progressPercent"
    },
    {
      "type": "AssignmentStatus",
      "name": "status"
    },
    {
      "type": "EnrollmentState",
      "name": "enrollmentState"
    }
  ],
  "PracticalScheduleDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "enrollmentId"
    },
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "string?",
      "name": "courseTitle"
    },
    {
      "type": "long",
      "name": "userId"
    },
    {
      "type": "string?",
      "name": "traineeName"
    },
    {
      "type": "long",
      "name": "trainerId"
    },
    {
      "type": "string?",
      "name": "trainerName"
    },
    {
      "type": "DateTimeOffset",
      "name": "scheduledAt"
    },
    {
      "type": "string",
      "name": "location"
    },
    {
      "type": "string?",
      "name": "note"
    },
    {
      "type": "ScheduleStatus",
      "name": "status"
    }
  ],
  "PracticalScheduleRequest": [
    {
      "type": "DateTimeOffset?",
      "name": "scheduledAt"
    },
    {
      "type": "string?",
      "name": "location"
    },
    {
      "type": "string?",
      "name": "note"
    }
  ],
  "QuestionBankDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "QuestionType",
      "name": "questionType"
    },
    {
      "type": "string",
      "name": "questionText"
    },
    {
      "type": "IReadOnlyList<QuizOption>",
      "name": "options"
    },
    {
      "type": "IReadOnlyList<string>",
      "name": "correctOptions"
    },
    {
      "type": "long?",
      "name": "courseId"
    },
    {
      "type": "ModuleType?",
      "name": "moduleType"
    },
    {
      "type": "long",
      "name": "createdBy"
    },
    {
      "type": "DateTimeOffset",
      "name": "createdAt"
    }
  ],
  "QuestionBankRequest": [
    {
      "type": "QuestionType?",
      "name": "questionType"
    },
    {
      "type": "string?",
      "name": "questionText"
    },
    {
      "type": "IReadOnlyList<QuizOptionRequest>?",
      "name": "options"
    },
    {
      "type": "IReadOnlyList<string>?",
      "name": "correctOptions"
    },
    {
      "type": "long?",
      "name": "courseId"
    },
    {
      "type": "ModuleType?",
      "name": "moduleType"
    }
  ],
  "SkillDto": [
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "string",
      "name": "courseTitle"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "SkillStatus",
      "name": "status"
    },
    {
      "type": "long?",
      "name": "certificateId"
    },
    {
      "type": "DateTimeOffset?",
      "name": "issuedAt"
    }
  ],
  "EmployeeSkillSummaryDto": [
    {
      "type": "long",
      "name": "userId"
    },
    {
      "type": "string",
      "name": "fullName"
    },
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "branchCode"
    },
    {
      "type": "int",
      "name": "certifiedSkills"
    },
    {
      "type": "int",
      "name": "requiredSkills"
    },
    {
      "type": "int",
      "name": "inTraining"
    },
    {
      "type": "int",
      "name": "overdue"
    },
    {
      "type": "string",
      "name": "status"
    }
  ],
  "TrainingRegulationDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "CourseType",
      "name": "courseType"
    },
    {
      "type": "RoleName?",
      "name": "mandatoryForRole"
    },
    {
      "type": "CourseType?",
      "name": "prerequisiteType"
    },
    {
      "type": "int",
      "name": "dueDays"
    },
    {
      "type": "int",
      "name": "maxRetakes"
    },
    {
      "type": "int",
      "name": "minAttendancePct"
    },
    {
      "type": "DateOnly",
      "name": "effectiveFrom"
    }
  ],
  "TrainingRegulationRequest": [
    {
      "type": "CourseType?",
      "name": "courseType"
    },
    {
      "type": "RoleName?",
      "name": "mandatoryForRole"
    },
    {
      "type": "CourseType?",
      "name": "prerequisiteType"
    },
    {
      "type": "int?",
      "name": "dueDays"
    },
    {
      "type": "int?",
      "name": "maxRetakes"
    },
    {
      "type": "int?",
      "name": "minAttendancePct"
    },
    {
      "type": "DateOnly?",
      "name": "effectiveFrom"
    }
  ],
  "TrainingNeedDto": [
    {
      "type": "long",
      "name": "userId"
    },
    {
      "type": "string",
      "name": "username"
    },
    {
      "type": "string",
      "name": "fullName"
    },
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "string",
      "name": "courseTitle"
    },
    {
      "type": "CourseType",
      "name": "courseType"
    },
    {
      "type": "string",
      "name": "reason"
    },
    {
      "type": "long?",
      "name": "regulationId"
    },
    {
      "type": "int",
      "name": "dueDays"
    },
    {
      "type": "CourseType?",
      "name": "prerequisiteType"
    },
    {
      "type": "EnrollmentState?",
      "name": "enrollmentState"
    }
  ],
  "TrainingSessionDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "trainingClassId"
    },
    {
      "type": "int",
      "name": "sessionNo"
    },
    {
      "type": "DateOnly",
      "name": "scheduledDate"
    },
    {
      "type": "TimeOnly",
      "name": "startTime"
    },
    {
      "type": "int",
      "name": "durationMinutes"
    },
    {
      "type": "string?",
      "name": "location"
    },
    {
      "type": "long",
      "name": "trainerId"
    },
    {
      "type": "IReadOnlyList<long>",
      "name": "moduleIds"
    }
  ],
  "TrainingClassDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "string",
      "name": "name"
    },
    {
      "type": "DateOnly",
      "name": "startDate"
    },
    {
      "type": "DateOnly",
      "name": "endDate"
    },
    {
      "type": "long",
      "name": "openedBy"
    },
    {
      "type": "ClassState",
      "name": "state"
    },
    {
      "type": "int",
      "name": "enrolledCount"
    },
    {
      "type": "IReadOnlyList<TrainingSessionDto>",
      "name": "sessions"
    }
  ],
  "TrainingClassRequest": [
    {
      "type": "long?",
      "name": "courseId"
    },
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "string?",
      "name": "name"
    },
    {
      "type": "DateOnly?",
      "name": "startDate"
    },
    {
      "type": "DateOnly?",
      "name": "endDate"
    }
  ],
  "SessionRequest": [
    {
      "type": "int?",
      "name": "sessionNo"
    },
    {
      "type": "DateOnly?",
      "name": "scheduledDate"
    },
    {
      "type": "TimeOnly?",
      "name": "startTime"
    },
    {
      "type": "int?",
      "name": "durationMinutes"
    },
    {
      "type": "string?",
      "name": "location"
    },
    {
      "type": "long?",
      "name": "trainerId"
    },
    {
      "type": "IReadOnlyList<long>?",
      "name": "moduleIds"
    }
  ],
  "OpenClassRequest": [
    {
      "type": "IReadOnlyList<long>?",
      "name": "traineeIds"
    }
  ],
  "OpenClassResultDto": [
    {
      "type": "TrainingClassDto",
      "name": "class"
    },
    {
      "type": "IReadOnlyList<long>",
      "name": "enrollmentIds"
    },
    {
      "type": "IReadOnlyList<long>",
      "name": "skippedUserIds"
    }
  ],
  "AttendanceEntryDto": [
    {
      "type": "long",
      "name": "enrollmentId"
    },
    {
      "type": "long",
      "name": "userId"
    },
    {
      "type": "string",
      "name": "fullName"
    },
    {
      "type": "AttendanceStatus?",
      "name": "status"
    },
    {
      "type": "string?",
      "name": "note"
    },
    {
      "type": "DateTimeOffset?",
      "name": "recordedAt"
    },
    {
      "type": "bool",
      "name": "attendanceStillReachable"
    }
  ],
  "AttendanceSheetDto": [
    {
      "type": "long",
      "name": "sessionId"
    },
    {
      "type": "long",
      "name": "trainingClassId"
    },
    {
      "type": "ClassState",
      "name": "classState"
    },
    {
      "type": "IReadOnlyList<AttendanceEntryDto>",
      "name": "entries"
    }
  ],
  "AttendanceRequest": [
    {
      "type": "IReadOnlyList<AttendanceEntryRequest>?",
      "name": "entries"
    }
  ],
  "AttendanceEntryRequest": [
    {
      "type": "long?",
      "name": "enrollmentId"
    },
    {
      "type": "AttendanceStatus?",
      "name": "status"
    },
    {
      "type": "string?",
      "name": "note"
    }
  ],
  "EnrollmentDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "long",
      "name": "courseId"
    },
    {
      "type": "string",
      "name": "courseTitle"
    },
    {
      "type": "CourseType",
      "name": "courseType"
    },
    {
      "type": "long?",
      "name": "recipeVersionId"
    },
    {
      "type": "long?",
      "name": "trainingClassId"
    },
    {
      "type": "long",
      "name": "userId"
    },
    {
      "type": "DateOnly?",
      "name": "dueDate"
    },
    {
      "type": "int",
      "name": "progressPercent"
    },
    {
      "type": "EnrollmentState",
      "name": "state"
    },
    {
      "type": "DateTimeOffset",
      "name": "enrolledAt"
    },
    {
      "type": "DateTimeOffset?",
      "name": "completedAt"
    },
    {
      "type": "bool",
      "name": "overdue"
    }
  ],
  "EnrollmentModuleDto": [
    {
      "type": "CourseModuleDto",
      "name": "module"
    },
    {
      "type": "bool",
      "name": "completed"
    },
    {
      "type": "DateTimeOffset?",
      "name": "completedAt"
    }
  ],
  "MissingModuleDto": [
    {
      "type": "long",
      "name": "courseModuleId"
    },
    {
      "type": "ModuleType",
      "name": "moduleType"
    }
  ],
  "EligibilityDto": [
    {
      "type": "bool",
      "name": "eligible"
    },
    {
      "type": "IReadOnlyList<MissingModuleDto>",
      "name": "missingModules"
    },
    {
      "type": "int",
      "name": "attendancePct"
    },
    {
      "type": "int",
      "name": "minAttendancePct"
    },
    {
      "type": "bool",
      "name": "attendanceStillReachable"
    },
    {
      "type": "int",
      "name": "retakesLeft"
    },
    {
      "type": "long?",
      "name": "regulationId"
    },
    {
      "type": "EnrollmentState",
      "name": "state"
    }
  ],
  "UserDto": [
    {
      "type": "long",
      "name": "id"
    },
    {
      "type": "string",
      "name": "username"
    },
    {
      "type": "string",
      "name": "email"
    },
    {
      "type": "string",
      "name": "fullName"
    },
    {
      "type": "RoleName",
      "name": "role"
    },
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "UserStatus",
      "name": "status"
    },
    {
      "type": "DateTimeOffset",
      "name": "createdAt"
    }
  ],
  "CreateUserRequest": [
    {
      "type": "string?",
      "name": "username"
    },
    {
      "type": "string?",
      "name": "email"
    },
    {
      "type": "string?",
      "name": "password"
    },
    {
      "type": "string?",
      "name": "fullName"
    },
    {
      "type": "RoleName?",
      "name": "role"
    },
    {
      "type": "long?",
      "name": "branchId"
    }
  ],
  "UpdateUserRequest": [
    {
      "type": "string?",
      "name": "username"
    },
    {
      "type": "string?",
      "name": "email"
    },
    {
      "type": "string?",
      "name": "password"
    },
    {
      "type": "string?",
      "name": "fullName"
    },
    {
      "type": "RoleName?",
      "name": "role"
    },
    {
      "type": "long?",
      "name": "branchId"
    },
    {
      "type": "UserStatus?",
      "name": "status"
    }
  ],
  "ErrorDetail": [
    {
      "type": "string",
      "name": "field"
    },
    {
      "type": "string",
      "name": "issue"
    }
  ],
  "QuizOption": [
    {
      "type": "string",
      "name": "key"
    },
    {
      "type": "string",
      "name": "text"
    }
  ],
  "PilotCriterion": [
    {
      "type": "CriterionType",
      "name": "type"
    },
    {
      "type": "decimal?",
      "name": "cupsPerDayPerBranch"
    },
    {
      "type": "long?",
      "name": "controlRecipeId"
    },
    {
      "type": "decimal?",
      "name": "minPercentOfControl"
    },
    {
      "type": "decimal?",
      "name": "maxDropSecondHalfPct"
    }
  ],
  "CriterionResult": [
    {
      "type": "CriterionType",
      "name": "type"
    },
    {
      "type": "decimal",
      "name": "target"
    },
    {
      "type": "decimal?",
      "name": "actual"
    },
    {
      "type": "Verdict",
      "name": "verdict"
    }
  ],
  "BranchResult": [
    {
      "type": "long",
      "name": "branchId"
    },
    {
      "type": "int",
      "name": "expectedDays"
    },
    {
      "type": "int",
      "name": "tradingDays"
    },
    {
      "type": "int",
      "name": "cupsTotal"
    },
    {
      "type": "decimal",
      "name": "cupsPerDay"
    },
    {
      "type": "bool",
      "name": "coverageComplete"
    },
    {
      "type": "Verdict",
      "name": "verdict"
    },
    {
      "type": "IReadOnlyList<CriterionResult>",
      "name": "criteria"
    }
  ],
  "WeekResult": [
    {
      "type": "int",
      "name": "week"
    },
    {
      "type": "DateOnly",
      "name": "from"
    },
    {
      "type": "DateOnly",
      "name": "to"
    },
    {
      "type": "int",
      "name": "cups"
    }
  ],
  "PilotEvaluation": [
    {
      "type": "long",
      "name": "pilotId"
    },
    {
      "type": "PilotState",
      "name": "state"
    },
    {
      "type": "DateOnly",
      "name": "from"
    },
    {
      "type": "DateOnly",
      "name": "to"
    },
    {
      "type": "bool",
      "name": "coverageComplete"
    },
    {
      "type": "Verdict",
      "name": "overall"
    },
    {
      "type": "IReadOnlyList<CriterionResult>",
      "name": "criteria"
    },
    {
      "type": "IReadOnlyList<BranchResult>",
      "name": "byBranch"
    },
    {
      "type": "IReadOnlyList<WeekResult>",
      "name": "byWeek"
    }
  ],
  "PosRowError": [
    {
      "type": "int",
      "name": "row"
    },
    {
      "type": "string",
      "name": "code"
    },
    {
      "type": "string",
      "name": "message"
    }
  ],
  "ChecklistMark": [
    {
      "type": "long?",
      "name": "recipeStepId"
    },
    {
      "type": "bool",
      "name": "passed"
    },
    {
      "type": "string?",
      "name": "note"
    },
    {
      "type": "long?",
      "name": "lessonId"
    }
  ],
  "ModuleEffectiveness": [
    {
      "type": "long",
      "name": "courseModuleId"
    },
    {
      "type": "ModuleType",
      "name": "moduleType"
    },
    {
      "type": "int",
      "name": "firstAttempts"
    },
    {
      "type": "int",
      "name": "passed"
    },
    {
      "type": "decimal?",
      "name": "passRatePct"
    },
    {
      "type": "bool",
      "name": "highlighted"
    }
  ]
} as const
export const enumValues = {
  "RepairMode": [
    "AI",
    "MANUAL"
  ],
  "AssignmentStatus": [
    "ASSIGNED",
    "IN_PROGRESS",
    "THEORY_COMPLETED",
    "QUIZ_PASSED",
    "PRACTICAL_PENDING",
    "COMPLETED",
    "OVERDUE",
    "LOCKED",
    "CLOSED"
  ],
  "SkillStatus": [
    "CERTIFIED",
    "NEEDS_RECERT",
    "TRAINING",
    "NOT_CERTIFIED"
  ],
  "CourseType": [
    "INDUCTION",
    "PRODUCT",
    "EQUIPMENT",
    "RECERTIFICATION"
  ],
  "CourseState": [
    "DRAFT",
    "PENDING_APPROVAL",
    "PUBLISHED",
    "OUT_OF_DATE",
    "ARCHIVED"
  ],
  "ModuleType": [
    "PRODUCT_OVERVIEW",
    "INGREDIENTS",
    "EQUIPMENT",
    "SOP",
    "TECHNIQUE",
    "COMMON_MISTAKES",
    "EXCEPTION_HANDLING"
  ],
  "ModuleSource": [
    "GENERATED",
    "AUTHORED",
    "MIXED"
  ],
  "ModuleState": [
    "EMPTY",
    "DRAFT",
    "COMPLETE",
    "NEEDS_REVIEW"
  ],
  "QuestionType": [
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
    "TRUE_FALSE"
  ],
  "UserStatus": [
    "ACTIVE",
    "INACTIVE"
  ],
  "RoleName": [
    "ADMIN",
    "RD_SPECIALIST",
    "RD_MANAGER",
    "TRAINER",
    "TRAINEE",
    "QUALITY_AUDITOR",
    "BRANCH_MANAGER",
    "TRAINING_MANAGER"
  ],
  "ImpactType": [
    "OUT_OF_DATE",
    "NEEDS_RECERT",
    "BRANCH_AFFECTED"
  ],
  "LaunchStatus": [
    "PREPARING",
    "READY",
    "LIVE",
    "WITHDRAWN"
  ],
  "CriterionType": [
    "ABSOLUTE",
    "RELATIVE",
    "RETENTION"
  ],
  "Verdict": [
    "PASS",
    "FAIL",
    "INCOMPLETE"
  ],
  "PilotState": [
    "DRAFT",
    "RUNNING",
    "ENDED",
    "CANCELLED"
  ],
  "PilotBranchState": [
    "PREPARING",
    "READY",
    "LIVE"
  ],
  "LaunchDecisionType": [
    "ROLLOUT",
    "REVISE",
    "DISCONTINUE"
  ],
  "BranchStatus": [
    "ACTIVE",
    "CLOSED"
  ],
  "CatalogStatus": [
    "ACTIVE",
    "INACTIVE"
  ],
  "CategoryKind": [
    "DRINK",
    "INGREDIENT",
    "TRAINING",
    "EQUIPMENT"
  ],
  "IngredientUnit": [
    "g",
    "ml",
    "pcs"
  ],
  "DosingUnit": [
    "g",
    "ml",
    "sec",
    "degC",
    "bar"
  ],
  "AuditResult": [
    "PASSED",
    "FAILED"
  ],
  "CorrectiveActionStatus": [
    "OPEN",
    "IN_PROGRESS",
    "CLOSED"
  ],
  "RecipeCategory": [
    "TEA",
    "COFFEE",
    "OTHER"
  ],
  "RecipeOrigin": [
    "NEW",
    "EXISTING"
  ],
  "RecipeStatus": [
    "ACTIVE",
    "DISCONTINUED"
  ],
  "VersionState": [
    "DRAFT",
    "VALIDATED",
    "REJECTED",
    "RELEASED",
    "SUPERSEDED"
  ],
  "DependencyType": [
    "FINISH_TO_START",
    "REQUIRES_OUTPUT"
  ],
  "CheckType": [
    "EQUIPMENT",
    "ORDERING",
    "INGREDIENT"
  ],
  "ReviewAction": [
    "ACCEPT",
    "EDIT",
    "REJECT"
  ],
  "ReviewOutcome": [
    "ACCEPTED",
    "EDITED",
    "REJECTED"
  ],
  "SalesGrouping": [
    "BRANCH",
    "DAY",
    "WEEK"
  ],
  "SalesSource": [
    "MANUAL",
    "POS_IMPORT"
  ],
  "CertificateStatus": [
    "VALID",
    "NEEDS_RECERT",
    "SUPERSEDED"
  ],
  "EnrollmentState": [
    "ASSIGNED",
    "IN_PROGRESS",
    "ELIGIBLE",
    "PASSED",
    "LOCKED",
    "CLOSED"
  ],
  "AttendanceStatus": [
    "PRESENT",
    "ABSENT",
    "EXCUSED"
  ],
  "ScheduleStatus": [
    "SCHEDULED",
    "COMPLETED",
    "CANCELLED"
  ],
  "ClassState": [
    "PLANNED",
    "RUNNING",
    "CLOSED",
    "CANCELLED"
  ]
} as const
export const endpoints = {
  "ImpactAnalysis.Analyze": {
    "method": "POST",
    "path": "/api/v1/impact-analysis",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/AuditController.cs",
    "body": "ImpactRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "ImpactAnalysisDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "ImpactAnalysis.Get": {
    "method": "GET",
    "path": "/api/v1/impact-analysis/{runId}",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/AuditController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "string",
        "name": "runId"
      }
    ],
    "response": "ImpactAnalysisDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "ImpactAnalysis.Commit": {
    "method": "POST",
    "path": "/api/v1/impact-analysis/{runId}/commit",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/AuditController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "string",
        "name": "runId"
      }
    ],
    "response": "ImpactAnalysisDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "AuditLog.List": {
    "method": "GET",
    "path": "/api/v1/audit-log",
    "roles": [
      "QUALITY_AUDITOR",
      "RD_MANAGER",
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/AuditController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "entityType",
        "type": "string?"
      },
      {
        "name": "entityId",
        "type": "long?"
      },
      {
        "name": "action",
        "type": "string?"
      },
      {
        "name": "userId",
        "type": "long?"
      },
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "from",
        "type": "DateOnly?"
      },
      {
        "name": "to",
        "type": "DateOnly?"
      }
    ],
    "params": [],
    "response": "PagedResult<AuditEntryDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "AuditLog.Trace": {
    "method": "GET",
    "path": "/api/v1/audit-log/trace/{entityType}/{entityId:long}",
    "roles": [
      "QUALITY_AUDITOR",
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/AuditController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "string",
        "name": "entityType"
      },
      {
        "type": "long",
        "name": "entityId"
      }
    ],
    "response": "VersionTraceDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Reports.Compliance": {
    "method": "GET",
    "path": "/api/v1/reports/compliance",
    "roles": [
      "QUALITY_AUDITOR",
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/AuditController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "format",
        "type": "string?"
      },
      {
        "name": "from",
        "type": "DateOnly?"
      },
      {
        "name": "to",
        "type": "DateOnly?"
      },
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "courseId",
        "type": "long?"
      },
      {
        "name": "recipeVersionId",
        "type": "long?"
      }
    ],
    "params": [],
    "response": "FileContentResult",
    "binary": true,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Auth.Login": {
    "method": "POST",
    "path": "/api/v1/auth/login",
    "roles": [],
    "source": "backend/src/BrewForge.Api/Controllers/AuthController.cs",
    "body": "LoginRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "LoginResponse",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Auth.Refresh": {
    "method": "POST",
    "path": "/api/v1/auth/refresh",
    "roles": [],
    "source": "backend/src/BrewForge.Api/Controllers/AuthController.cs",
    "body": "RefreshRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "LoginResponse",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Auth.Logout": {
    "method": "POST",
    "path": "/api/v1/auth/logout",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "TRAINEE",
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/AuthController.cs",
    "body": "RefreshRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "IActionResult",
    "binary": true,
    "upload": false,
    "idempotency": false,
    "status": 204
  },
  "Auth.Me": {
    "method": "GET",
    "path": "/api/v1/auth/me",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "TRAINEE",
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/AuthController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "MeResponse",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Branches.List": {
    "method": "GET",
    "path": "/api/v1/branches",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "TRAINEE",
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/BranchesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "q",
        "type": "string?"
      },
      {
        "name": "status",
        "type": "string?"
      }
    ],
    "params": [],
    "response": "PagedResult<BranchDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Branches.Get": {
    "method": "GET",
    "path": "/api/v1/branches/{id:long}",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "TRAINEE",
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/BranchesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "BranchDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Branches.Create": {
    "method": "POST",
    "path": "/api/v1/branches",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/BranchesController.cs",
    "body": "BranchRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "BranchDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Branches.Update": {
    "method": "PUT",
    "path": "/api/v1/branches/{id:long}",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/BranchesController.cs",
    "body": "BranchRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "BranchDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Branches.Deactivate": {
    "method": "POST",
    "path": "/api/v1/branches/{id:long}/deactivate",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/BranchesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "BranchDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Products.List": {
    "method": "GET",
    "path": "/api/v1/products",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "TRAINEE",
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "q",
        "type": "string?"
      },
      {
        "name": "categoryId",
        "type": "long?"
      },
      {
        "name": "status",
        "type": "string?"
      }
    ],
    "params": [],
    "response": "PagedResult<ProductDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Products.Get": {
    "method": "GET",
    "path": "/api/v1/products/{id:long}",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "TRAINEE",
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "ProductDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Products.Create": {
    "method": "POST",
    "path": "/api/v1/products",
    "roles": [
      "RD_SPECIALIST"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": "ProductRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "ProductDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Products.Update": {
    "method": "PUT",
    "path": "/api/v1/products/{id:long}",
    "roles": [
      "RD_SPECIALIST"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": "ProductRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "ProductDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Products.Deactivate": {
    "method": "POST",
    "path": "/api/v1/products/{id:long}/deactivate",
    "roles": [
      "RD_SPECIALIST"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "ProductDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "QuestionBank.List": {
    "method": "GET",
    "path": "/api/v1/question-bank",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "q",
        "type": "string?"
      },
      {
        "name": "courseId",
        "type": "long?"
      },
      {
        "name": "recipeVersionId",
        "type": "long?"
      },
      {
        "name": "questionType",
        "type": "string?"
      }
    ],
    "params": [],
    "response": "PagedResult<QuestionBankDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "QuestionBank.Get": {
    "method": "GET",
    "path": "/api/v1/question-bank/{id:long}",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "QuestionBankDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "QuestionBank.Create": {
    "method": "POST",
    "path": "/api/v1/question-bank",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": "QuestionBankRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "QuestionBankDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "QuestionBank.Update": {
    "method": "PUT",
    "path": "/api/v1/question-bank/{id:long}",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": "QuestionBankRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "QuestionBankDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "QuestionBank.Delete": {
    "method": "DELETE",
    "path": "/api/v1/question-bank/{id:long}",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IActionResult",
    "binary": true,
    "upload": false,
    "idempotency": false,
    "status": 204
  },
  "QuestionBank.AddToCourse": {
    "method": "POST",
    "path": "/api/v1/question-bank/{id:long}/add-to-course/{courseId:long}",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      },
      {
        "type": "long",
        "name": "courseId"
      }
    ],
    "response": "QuizQuestionDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Assignments.List": {
    "method": "GET",
    "path": "/api/v1/assignments",
    "roles": [
      "TRAINER",
      "TRAINING_MANAGER",
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "courseId",
        "type": "long?"
      },
      {
        "name": "status",
        "type": "string?"
      }
    ],
    "params": [],
    "response": "PagedResult<AssignmentDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Assignments.Assign": {
    "method": "POST",
    "path": "/api/v1/assignments",
    "roles": [
      "TRAINER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": "AssignmentRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "AssignmentResultDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "PracticalSchedules.List": {
    "method": "GET",
    "path": "/api/v1/practical-schedules",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "status",
        "type": "string?"
      },
      {
        "name": "from",
        "type": "DateOnly?"
      },
      {
        "name": "to",
        "type": "DateOnly?"
      }
    ],
    "params": [],
    "response": "PagedResult<PracticalScheduleDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "PracticalSchedules.ForEnrollment": {
    "method": "GET",
    "path": "/api/v1/enrollments/{id:long}/practical-schedules",
    "roles": [
      "TRAINEE",
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IReadOnlyList<PracticalScheduleDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "PracticalSchedules.Create": {
    "method": "POST",
    "path": "/api/v1/enrollments/{id:long}/practical-schedules",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": "PracticalScheduleRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PracticalScheduleDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "PracticalSchedules.Reschedule": {
    "method": "PUT",
    "path": "/api/v1/practical-schedules/{id:long}",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": "PracticalScheduleRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PracticalScheduleDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "PracticalSchedules.Cancel": {
    "method": "POST",
    "path": "/api/v1/practical-schedules/{id:long}/cancel",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PracticalScheduleDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "PracticalSchedules.Complete": {
    "method": "POST",
    "path": "/api/v1/practical-schedules/{id:long}/complete",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PracticalScheduleDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Skills.Mine": {
    "method": "GET",
    "path": "/api/v1/me/skills",
    "roles": [
      "TRAINEE",
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "IReadOnlyList<SkillDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Skills.Employees": {
    "method": "GET",
    "path": "/api/v1/dashboards/employees",
    "roles": [
      "BRANCH_MANAGER",
      "TRAINER",
      "TRAINING_MANAGER",
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "branchId",
        "type": "long?"
      }
    ],
    "params": [],
    "response": "IReadOnlyList<EmployeeSkillSummaryDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Settings.List": {
    "method": "GET",
    "path": "/api/v1/settings",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "IReadOnlyList<SettingDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Settings.Update": {
    "method": "PUT",
    "path": "/api/v1/settings/{key}",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CatalogAndTrainingSupportControllers.cs",
    "body": "SettingRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "string",
        "name": "key"
      }
    ],
    "response": "SettingDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Categories.List": {
    "method": "GET",
    "path": "/api/v1/categories",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "TRAINEE",
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CategoriesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "q",
        "type": "string?"
      },
      {
        "name": "kind",
        "type": "string?"
      },
      {
        "name": "status",
        "type": "string?"
      }
    ],
    "params": [],
    "response": "PagedResult<CategoryDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Categories.Get": {
    "method": "GET",
    "path": "/api/v1/categories/{id:long}",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "TRAINEE",
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CategoriesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CategoryDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Categories.Create": {
    "method": "POST",
    "path": "/api/v1/categories",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CategoriesController.cs",
    "body": "CategoryRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "CategoryDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Categories.Update": {
    "method": "PUT",
    "path": "/api/v1/categories/{id:long}",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CategoriesController.cs",
    "body": "CategoryRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CategoryDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Categories.Deactivate": {
    "method": "POST",
    "path": "/api/v1/categories/{id:long}/deactivate",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CategoriesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CategoryDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Certificates.Mine": {
    "method": "GET",
    "path": "/api/v1/me/certificates",
    "roles": [
      "TRAINEE",
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CertificatesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "IReadOnlyList<CertificateDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Certificates.Get": {
    "method": "GET",
    "path": "/api/v1/certificates/{id:long}",
    "roles": [
      "TRAINEE",
      "TRAINER",
      "QUALITY_AUDITOR"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CertificatesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CertificateDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Dashboards.TrainingProgress": {
    "method": "GET",
    "path": "/api/v1/dashboards/training-progress",
    "roles": [
      "TRAINER",
      "RD_MANAGER",
      "BRANCH_MANAGER",
      "QUALITY_AUDITOR"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CertificatesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "courseId",
        "type": "long?"
      }
    ],
    "params": [],
    "response": "IReadOnlyList<TrainingProgressRowDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Dashboards.BranchPerformance": {
    "method": "GET",
    "path": "/api/v1/dashboards/branch-performance",
    "roles": [
      "RD_MANAGER",
      "BRANCH_MANAGER",
      "QUALITY_AUDITOR"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CertificatesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "recipeId",
        "type": "long?"
      },
      {
        "name": "from",
        "type": "DateOnly?"
      },
      {
        "name": "to",
        "type": "DateOnly?"
      }
    ],
    "params": [],
    "response": "BranchPerformanceDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Dashboards.CourseEffectiveness": {
    "method": "GET",
    "path": "/api/v1/dashboards/course-effectiveness",
    "roles": [
      "TRAINING_MANAGER",
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CertificatesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "courseId",
        "type": "long?"
      }
    ],
    "params": [],
    "response": "IReadOnlyList<CourseEffectivenessDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Courses.List": {
    "method": "GET",
    "path": "/api/v1/courses",
    "roles": [
      "TRAINER",
      "TRAINING_MANAGER",
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "q",
        "type": "string?"
      },
      {
        "name": "state",
        "type": "string?"
      },
      {
        "name": "courseType",
        "type": "string?"
      },
      {
        "name": "recipeVersionId",
        "type": "long?"
      }
    ],
    "params": [],
    "response": "PagedResult<CourseDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Courses.Create": {
    "method": "POST",
    "path": "/api/v1/courses",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": "CreateCourseRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "CourseDetailDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Courses.Get": {
    "method": "GET",
    "path": "/api/v1/courses/{id:long}",
    "roles": [
      "TRAINER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CourseDetailDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Courses.Modules": {
    "method": "GET",
    "path": "/api/v1/courses/{id:long}/modules",
    "roles": [
      "TRAINER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IReadOnlyList<CourseModuleDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Courses.GetQuiz": {
    "method": "GET",
    "path": "/api/v1/courses/{id:long}/quiz",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "QuizDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Courses.UpdateQuiz": {
    "method": "PUT",
    "path": "/api/v1/courses/{id:long}/quiz",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": "QuizRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "QuizDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Courses.ListQuestions": {
    "method": "GET",
    "path": "/api/v1/courses/{id:long}/quiz/questions",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IReadOnlyList<QuizQuestionDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Courses.AddQuestion": {
    "method": "POST",
    "path": "/api/v1/courses/{id:long}/quiz/questions",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": "QuizQuestionRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "QuizQuestionDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Courses.SetPracticalChecklist": {
    "method": "PUT",
    "path": "/api/v1/courses/{id:long}/practical-checklist",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": "ChecklistRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IReadOnlyList<ChecklistItemDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Courses.Submit": {
    "method": "POST",
    "path": "/api/v1/courses/{id:long}/submit",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CourseDetailDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Courses.Approve": {
    "method": "POST",
    "path": "/api/v1/courses/{id:long}/approve",
    "roles": [
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CourseDetailDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Courses.Return": {
    "method": "POST",
    "path": "/api/v1/courses/{id:long}/return",
    "roles": [
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": "ReturnCourseRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CourseDetailDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Courses.Rebuild": {
    "method": "POST",
    "path": "/api/v1/courses/{id:long}/rebuild",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CourseDetailDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "CourseModules.Update": {
    "method": "PUT",
    "path": "/api/v1/course-modules/{id:long}",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": "UpdateModuleRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CourseModuleDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "CourseModules.Regenerate": {
    "method": "POST",
    "path": "/api/v1/course-modules/{id:long}/regenerate",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CourseModuleDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "CourseModules.ListLessons": {
    "method": "GET",
    "path": "/api/v1/course-modules/{id:long}/lessons",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IReadOnlyList<LessonDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "CourseModules.AddLesson": {
    "method": "POST",
    "path": "/api/v1/course-modules/{id:long}/lessons",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": "LessonRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "LessonDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Lessons.Update": {
    "method": "PUT",
    "path": "/api/v1/lessons/{id:long}",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": "LessonRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "LessonDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Lessons.Delete": {
    "method": "DELETE",
    "path": "/api/v1/lessons/{id:long}",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/CoursesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IActionResult",
    "binary": true,
    "upload": false,
    "idempotency": false,
    "status": 204
  },
  "EquipmentClasses.List": {
    "method": "GET",
    "path": "/api/v1/equipment-classes",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "QUALITY_AUDITOR",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/EquipmentClassesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "q",
        "type": "string?"
      },
      {
        "name": "status",
        "type": "string?"
      }
    ],
    "params": [],
    "response": "PagedResult<EquipmentClassDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "EquipmentClasses.Get": {
    "method": "GET",
    "path": "/api/v1/equipment-classes/{id:long}",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "QUALITY_AUDITOR",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/EquipmentClassesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "EquipmentClassDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "EquipmentClasses.Create": {
    "method": "POST",
    "path": "/api/v1/equipment-classes",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/EquipmentClassesController.cs",
    "body": "EquipmentClassRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "EquipmentClassDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "EquipmentClasses.Update": {
    "method": "PUT",
    "path": "/api/v1/equipment-classes/{id:long}",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/EquipmentClassesController.cs",
    "body": "EquipmentClassRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "EquipmentClassDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "EquipmentClasses.Deactivate": {
    "method": "POST",
    "path": "/api/v1/equipment-classes/{id:long}/deactivate",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/EquipmentClassesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "EquipmentClassDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Ingredients.List": {
    "method": "GET",
    "path": "/api/v1/ingredients",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "QUALITY_AUDITOR",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/IngredientsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "q",
        "type": "string?"
      },
      {
        "name": "unit",
        "type": "string?"
      },
      {
        "name": "status",
        "type": "string?"
      }
    ],
    "params": [],
    "response": "PagedResult<IngredientDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Ingredients.Get": {
    "method": "GET",
    "path": "/api/v1/ingredients/{id:long}",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "QUALITY_AUDITOR",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/IngredientsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IngredientDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Ingredients.Create": {
    "method": "POST",
    "path": "/api/v1/ingredients",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/IngredientsController.cs",
    "body": "IngredientRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "IngredientDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Ingredients.Update": {
    "method": "PUT",
    "path": "/api/v1/ingredients/{id:long}",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/IngredientsController.cs",
    "body": "IngredientRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IngredientDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Ingredients.Deactivate": {
    "method": "POST",
    "path": "/api/v1/ingredients/{id:long}/deactivate",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/IngredientsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IngredientDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Notifications.PushConfig": {
    "method": "GET",
    "path": "/api/v1/push/config",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "TRAINEE",
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/NotificationsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "PushConfigDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Notifications.Mine": {
    "method": "GET",
    "path": "/api/v1/me/push-subscriptions",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "TRAINEE",
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/NotificationsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "IReadOnlyList<PushSubscriptionDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Notifications.Subscribe": {
    "method": "POST",
    "path": "/api/v1/me/push-subscriptions",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "TRAINEE",
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/NotificationsController.cs",
    "body": "PushSubscriptionRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "PushSubscriptionDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Notifications.Unsubscribe": {
    "method": "DELETE",
    "path": "/api/v1/me/push-subscriptions",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "TRAINEE",
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/NotificationsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "endpoint",
        "type": "string?"
      }
    ],
    "params": [],
    "response": "IActionResult",
    "binary": true,
    "upload": false,
    "idempotency": false,
    "status": 204
  },
  "Pilots.List": {
    "method": "GET",
    "path": "/api/v1/pilots",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/PilotsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "state",
        "type": "string?"
      },
      {
        "name": "recipeVersionId",
        "type": "long?"
      }
    ],
    "params": [],
    "response": "PagedResult<PilotDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Pilots.Create": {
    "method": "POST",
    "path": "/api/v1/pilots",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/PilotsController.cs",
    "body": "PilotRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "PilotDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Pilots.Get": {
    "method": "GET",
    "path": "/api/v1/pilots/{id:long}",
    "roles": [
      "RD_MANAGER",
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/PilotsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PilotDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Pilots.Update": {
    "method": "PUT",
    "path": "/api/v1/pilots/{id:long}",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/PilotsController.cs",
    "body": "PilotRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PilotDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Pilots.Readiness": {
    "method": "GET",
    "path": "/api/v1/pilots/{id:long}/readiness",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/PilotsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PilotReadinessDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Pilots.Start": {
    "method": "POST",
    "path": "/api/v1/pilots/{id:long}/start",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/PilotsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PilotDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Pilots.Cancel": {
    "method": "POST",
    "path": "/api/v1/pilots/{id:long}/cancel",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/PilotsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PilotDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Pilots.GoLive": {
    "method": "POST",
    "path": "/api/v1/pilots/{id:long}/branches/{branchId:long}/go-live",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/PilotsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      },
      {
        "type": "long",
        "name": "branchId"
      }
    ],
    "response": "PilotDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Pilots.Evaluation": {
    "method": "GET",
    "path": "/api/v1/pilots/{id:long}/evaluation",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/PilotsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PilotEvaluation",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Pilots.Decide": {
    "method": "POST",
    "path": "/api/v1/pilots/{id:long}/decision",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/PilotsController.cs",
    "body": "DecisionRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PilotDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "BranchLaunchStatus.List": {
    "method": "GET",
    "path": "/api/v1/branch-launch-status",
    "roles": [
      "RD_MANAGER",
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/PilotsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "recipeId",
        "type": "long?"
      },
      {
        "name": "status",
        "type": "string?"
      }
    ],
    "params": [],
    "response": "IReadOnlyList<BranchLaunchStatusDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "BranchLaunchStatus.Withdraw": {
    "method": "POST",
    "path": "/api/v1/branch-launch-status/{id:long}/withdraw",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/PilotsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "BranchLaunchStatusDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "BranchAudits.List": {
    "method": "GET",
    "path": "/api/v1/branch-audits",
    "roles": [
      "QUALITY_AUDITOR",
      "RD_MANAGER",
      "ADMIN",
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/QualityController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "recipeVersionId",
        "type": "long?"
      },
      {
        "name": "result",
        "type": "string?"
      },
      {
        "name": "from",
        "type": "DateOnly?"
      },
      {
        "name": "to",
        "type": "DateOnly?"
      }
    ],
    "params": [],
    "response": "PagedResult<BranchAuditDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "BranchAudits.Summary": {
    "method": "GET",
    "path": "/api/v1/branch-audits/summary",
    "roles": [
      "QUALITY_AUDITOR",
      "RD_MANAGER",
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/QualityController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "from",
        "type": "DateOnly?"
      },
      {
        "name": "to",
        "type": "DateOnly?"
      }
    ],
    "params": [],
    "response": "AuditSummaryDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "BranchAudits.UploadEvidence": {
    "method": "POST",
    "path": "/api/v1/branch-audits/evidence",
    "roles": [
      "QUALITY_AUDITOR"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/QualityController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "EvidenceDto",
    "binary": false,
    "upload": true,
    "idempotency": false,
    "status": 201
  },
  "BranchAudits.Evidence": {
    "method": "GET",
    "path": "/api/v1/branch-audits/evidence/{**key}",
    "roles": [
      "QUALITY_AUDITOR",
      "RD_MANAGER",
      "ADMIN",
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/QualityController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "string",
        "name": "key"
      }
    ],
    "response": "IActionResult",
    "binary": true,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "BranchAudits.Get": {
    "method": "GET",
    "path": "/api/v1/branch-audits/{id:long}",
    "roles": [
      "QUALITY_AUDITOR",
      "RD_MANAGER",
      "ADMIN",
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/QualityController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "BranchAuditDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "BranchAudits.Create": {
    "method": "POST",
    "path": "/api/v1/branch-audits",
    "roles": [
      "QUALITY_AUDITOR"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/QualityController.cs",
    "body": "BranchAuditRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "BranchAuditDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "CorrectiveActions.List": {
    "method": "GET",
    "path": "/api/v1/corrective-actions",
    "roles": [
      "QUALITY_AUDITOR",
      "RD_MANAGER",
      "ADMIN",
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/QualityController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "status",
        "type": "string?"
      }
    ],
    "params": [],
    "response": "PagedResult<CorrectiveActionDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "CorrectiveActions.Get": {
    "method": "GET",
    "path": "/api/v1/corrective-actions/{id:long}",
    "roles": [
      "QUALITY_AUDITOR",
      "RD_MANAGER",
      "ADMIN",
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/QualityController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CorrectiveActionDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "CorrectiveActions.Start": {
    "method": "POST",
    "path": "/api/v1/corrective-actions/{id:long}/start",
    "roles": [
      "QUALITY_AUDITOR",
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/QualityController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CorrectiveActionDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "CorrectiveActions.AssignRetraining": {
    "method": "POST",
    "path": "/api/v1/corrective-actions/{id:long}/assign-retraining",
    "roles": [
      "QUALITY_AUDITOR"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/QualityController.cs",
    "body": "RetrainingRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "AssignmentResultDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "CorrectiveActions.Close": {
    "method": "POST",
    "path": "/api/v1/corrective-actions/{id:long}/close",
    "roles": [
      "QUALITY_AUDITOR"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/QualityController.cs",
    "body": "CloseCorrectiveActionRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "CorrectiveActionDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Recipes.List": {
    "method": "GET",
    "path": "/api/v1/recipes",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "QUALITY_AUDITOR",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "q",
        "type": "string?"
      },
      {
        "name": "category",
        "type": "string?"
      },
      {
        "name": "origin",
        "type": "string?"
      },
      {
        "name": "status",
        "type": "string?"
      }
    ],
    "params": [],
    "response": "PagedResult<RecipeDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Recipes.Create": {
    "method": "POST",
    "path": "/api/v1/recipes",
    "roles": [
      "RD_SPECIALIST"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipesController.cs",
    "body": "CreateRecipeRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "RecipeDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Recipes.ImportExisting": {
    "method": "POST",
    "path": "/api/v1/recipes/import-existing",
    "roles": [
      "RD_SPECIALIST"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipesController.cs",
    "body": "ImportExistingRecipeRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "ImportedRecipeDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Recipes.Get": {
    "method": "GET",
    "path": "/api/v1/recipes/{id:long}",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "QUALITY_AUDITOR",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "RecipeDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Recipes.ListVersions": {
    "method": "GET",
    "path": "/api/v1/recipes/{id:long}/versions",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "QUALITY_AUDITOR",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IReadOnlyList<RecipeVersionSummaryDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Recipes.CreateVersion": {
    "method": "POST",
    "path": "/api/v1/recipes/{id:long}/versions",
    "roles": [
      "RD_SPECIALIST"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipesController.cs",
    "body": "CreateVersionRequest",
    "optionalBody": true,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "RecipeVersionDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "RecipeVersions.Get": {
    "method": "GET",
    "path": "/api/v1/recipe-versions/{id:long}",
    "roles": [
      "ADMIN",
      "RD_SPECIALIST",
      "RD_MANAGER",
      "TRAINER",
      "QUALITY_AUDITOR",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipeVersionsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "RecipeVersionDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "RecipeVersions.Update": {
    "method": "PUT",
    "path": "/api/v1/recipe-versions/{id:long}",
    "roles": [
      "RD_SPECIALIST"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipeVersionsController.cs",
    "body": "RecipeContentRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "RecipeVersionDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "RecipeVersions.GenerateDraft": {
    "method": "POST",
    "path": "/api/v1/recipe-versions/{id:long}/generate-draft",
    "roles": [
      "RD_SPECIALIST"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipeVersionsController.cs",
    "body": "GenerateDraftRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "DraftResultDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "RecipeVersions.Validate": {
    "method": "POST",
    "path": "/api/v1/recipe-versions/{id:long}/validate",
    "roles": [
      "RD_SPECIALIST",
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipeVersionsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "ValidationResultDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "RecipeVersions.Repair": {
    "method": "POST",
    "path": "/api/v1/recipe-versions/{id:long}/repair",
    "roles": [
      "RD_SPECIALIST"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipeVersionsController.cs",
    "body": "RepairRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "DraftResultDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "RecipeVersions.Submit": {
    "method": "POST",
    "path": "/api/v1/recipe-versions/{id:long}/submit",
    "roles": [
      "RD_SPECIALIST"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipeVersionsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "ValidationResultDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "RecipeVersions.Review": {
    "method": "POST",
    "path": "/api/v1/recipe-versions/{id:long}/review",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipeVersionsController.cs",
    "body": "ReviewRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "ReviewResultDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "RecipeVersions.Release": {
    "method": "POST",
    "path": "/api/v1/recipe-versions/{id:long}/release",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipeVersionsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "ReleaseResultDto",
    "binary": false,
    "upload": false,
    "idempotency": true,
    "status": 200
  },
  "RecipeVersions.Rollback": {
    "method": "POST",
    "path": "/api/v1/recipe-versions/{id:long}/rollback",
    "roles": [
      "RD_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/RecipeVersionsController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "RecipeVersionDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Sales.List": {
    "method": "GET",
    "path": "/api/v1/sales",
    "roles": [
      "BRANCH_MANAGER",
      "RD_MANAGER",
      "QUALITY_AUDITOR"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/SalesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "recipeId",
        "type": "long?"
      },
      {
        "name": "from",
        "type": "DateOnly?"
      },
      {
        "name": "to",
        "type": "DateOnly?"
      }
    ],
    "params": [],
    "response": "PagedResult<SalesRecordDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Sales.Drinks": {
    "method": "GET",
    "path": "/api/v1/sales/drinks",
    "roles": [
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/SalesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "tradingDate",
        "type": "DateOnly?"
      }
    ],
    "params": [],
    "response": "IReadOnlyList<SellableDrinkDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Sales.Create": {
    "method": "POST",
    "path": "/api/v1/sales",
    "roles": [
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/SalesController.cs",
    "body": "SalesRecordRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "SalesRecordDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Sales.Correct": {
    "method": "PUT",
    "path": "/api/v1/sales/{id:long}",
    "roles": [
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/SalesController.cs",
    "body": "SalesCorrectionRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "SalesRecordDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Sales.Import": {
    "method": "POST",
    "path": "/api/v1/sales/import",
    "roles": [
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/SalesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "PosImportResultDto",
    "binary": false,
    "upload": true,
    "idempotency": true,
    "status": 200
  },
  "Sales.ImportResult": {
    "method": "GET",
    "path": "/api/v1/sales/import/{jobId}",
    "roles": [
      "BRANCH_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/SalesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "string",
        "name": "jobId"
      }
    ],
    "response": "PosImportResultDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Sales.Aggregate": {
    "method": "GET",
    "path": "/api/v1/sales/aggregate",
    "roles": [
      "RD_MANAGER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/SalesController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "recipeVersionId",
        "type": "long?"
      },
      {
        "name": "recipeId",
        "type": "long?"
      },
      {
        "name": "groupBy",
        "type": "string?"
      },
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "from",
        "type": "DateOnly?"
      },
      {
        "name": "to",
        "type": "DateOnly?"
      },
      {
        "name": "controlRecipeId",
        "type": "long?"
      }
    ],
    "params": [],
    "response": "SalesAggregateDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "TrainingRegulations.List": {
    "method": "GET",
    "path": "/api/v1/training-regulations",
    "roles": [
      "TRAINING_MANAGER",
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "IReadOnlyList<TrainingRegulationDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "TrainingRegulations.Create": {
    "method": "POST",
    "path": "/api/v1/training-regulations",
    "roles": [
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": "TrainingRegulationRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "TrainingRegulationDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "TrainingRegulations.Update": {
    "method": "PUT",
    "path": "/api/v1/training-regulations/{id:long}",
    "roles": [
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": "TrainingRegulationRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "TrainingRegulationDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "TrainingNeeds.List": {
    "method": "GET",
    "path": "/api/v1/training-needs",
    "roles": [
      "TRAINER",
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "courseId",
        "type": "long?"
      }
    ],
    "params": [],
    "response": "IReadOnlyList<TrainingNeedDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "TrainingClasses.List": {
    "method": "GET",
    "path": "/api/v1/training-classes",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "state",
        "type": "string?"
      },
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "courseId",
        "type": "long?"
      }
    ],
    "params": [],
    "response": "PagedResult<TrainingClassDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "TrainingClasses.Create": {
    "method": "POST",
    "path": "/api/v1/training-classes",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": "TrainingClassRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "TrainingClassDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "TrainingClasses.Get": {
    "method": "GET",
    "path": "/api/v1/training-classes/{id:long}",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "TrainingClassDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "TrainingClasses.Update": {
    "method": "PUT",
    "path": "/api/v1/training-classes/{id:long}",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": "TrainingClassRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "TrainingClassDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "TrainingClasses.AddSession": {
    "method": "POST",
    "path": "/api/v1/training-classes/{id:long}/sessions",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": "SessionRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "TrainingSessionDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "TrainingClasses.Open": {
    "method": "POST",
    "path": "/api/v1/training-classes/{id:long}/open",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": "OpenClassRequest",
    "optionalBody": true,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "OpenClassResultDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "TrainingClasses.Close": {
    "method": "POST",
    "path": "/api/v1/training-classes/{id:long}/close",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "TrainingClassDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "TrainingSessions.Update": {
    "method": "PUT",
    "path": "/api/v1/training-sessions/{id:long}",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": "SessionRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "TrainingSessionDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "TrainingSessions.Delete": {
    "method": "DELETE",
    "path": "/api/v1/training-sessions/{id:long}",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IActionResult",
    "binary": true,
    "upload": false,
    "idempotency": false,
    "status": 204
  },
  "TrainingSessions.GetAttendance": {
    "method": "GET",
    "path": "/api/v1/training-sessions/{id:long}/attendance",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "AttendanceSheetDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "TrainingSessions.RecordAttendance": {
    "method": "PUT",
    "path": "/api/v1/training-sessions/{id:long}/attendance",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": "AttendanceRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "AttendanceSheetDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.Mine": {
    "method": "GET",
    "path": "/api/v1/me/enrollments",
    "roles": [
      "TRAINEE",
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "IReadOnlyList<EnrollmentDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.Get": {
    "method": "GET",
    "path": "/api/v1/enrollments/{id:long}",
    "roles": [
      "TRAINEE",
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "EnrollmentDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.Modules": {
    "method": "GET",
    "path": "/api/v1/enrollments/{id:long}/modules",
    "roles": [
      "TRAINEE",
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IReadOnlyList<EnrollmentModuleDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.CompleteModule": {
    "method": "POST",
    "path": "/api/v1/enrollments/{id:long}/modules/{moduleId:long}/complete",
    "roles": [
      "TRAINEE",
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      },
      {
        "type": "long",
        "name": "moduleId"
      }
    ],
    "response": "EnrollmentDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.Eligibility": {
    "method": "GET",
    "path": "/api/v1/enrollments/{id:long}/eligibility",
    "roles": [
      "TRAINEE",
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "EligibilityDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.Quiz": {
    "method": "GET",
    "path": "/api/v1/enrollments/{id:long}/quiz",
    "roles": [
      "TRAINEE",
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "LearnerQuizDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.AttemptQuiz": {
    "method": "POST",
    "path": "/api/v1/enrollments/{id:long}/quiz-attempts",
    "roles": [
      "TRAINEE",
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": "QuizAttemptRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "QuizAttemptResultDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.QuizAttempts": {
    "method": "GET",
    "path": "/api/v1/enrollments/{id:long}/quiz-attempts",
    "roles": [
      "TRAINEE",
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IReadOnlyList<QuizAttemptResultDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.UploadPracticalVideo": {
    "method": "POST",
    "path": "/api/v1/enrollments/{id:long}/practical-videos",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PracticalVideoDto",
    "binary": false,
    "upload": true,
    "idempotency": false,
    "status": 201
  },
  "Enrollments.PracticalVideos": {
    "method": "GET",
    "path": "/api/v1/enrollments/{id:long}/practical-videos",
    "roles": [
      "TRAINEE",
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IReadOnlyList<PracticalVideoDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.PracticalVideoContent": {
    "method": "GET",
    "path": "/api/v1/practical-videos/{id:long}",
    "roles": [
      "TRAINEE",
      "TRAINER",
      "TRAINING_MANAGER",
      "QUALITY_AUDITOR"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "IActionResult",
    "binary": true,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.EvaluatePractical": {
    "method": "POST",
    "path": "/api/v1/enrollments/{id:long}/practical-evaluation",
    "roles": [
      "TRAINER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": "PracticalEvaluationRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "PracticalEvaluationDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.Close": {
    "method": "POST",
    "path": "/api/v1/enrollments/{id:long}/close",
    "roles": [
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "EnrollmentDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Enrollments.Reset": {
    "method": "POST",
    "path": "/api/v1/enrollments/{id:long}/reset",
    "roles": [
      "TRAINING_MANAGER"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/TrainingController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "EnrollmentDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Users.List": {
    "method": "GET",
    "path": "/api/v1/users",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/UsersController.cs",
    "body": null,
    "optionalBody": false,
    "query": [
      {
        "name": "page",
        "type": "int?"
      },
      {
        "name": "size",
        "type": "int?"
      },
      {
        "name": "sort",
        "type": "string?"
      },
      {
        "name": "q",
        "type": "string?"
      },
      {
        "name": "role",
        "type": "string?"
      },
      {
        "name": "branchId",
        "type": "long?"
      },
      {
        "name": "status",
        "type": "string?"
      }
    ],
    "params": [],
    "response": "PagedResult<UserDto>",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Users.Get": {
    "method": "GET",
    "path": "/api/v1/users/{id:long}",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/UsersController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "UserDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Users.Create": {
    "method": "POST",
    "path": "/api/v1/users",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/UsersController.cs",
    "body": "CreateUserRequest",
    "optionalBody": false,
    "query": [],
    "params": [],
    "response": "UserDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 201
  },
  "Users.Update": {
    "method": "PUT",
    "path": "/api/v1/users/{id:long}",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/UsersController.cs",
    "body": "UpdateUserRequest",
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "UserDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  },
  "Users.Deactivate": {
    "method": "POST",
    "path": "/api/v1/users/{id:long}/deactivate",
    "roles": [
      "ADMIN"
    ],
    "source": "backend/src/BrewForge.Api/Controllers/UsersController.cs",
    "body": null,
    "optionalBody": false,
    "query": [],
    "params": [
      {
        "type": "long",
        "name": "id"
      }
    ],
    "response": "UserDto",
    "binary": false,
    "upload": false,
    "idempotency": false,
    "status": 200
  }
} as const
