# Objective
Apply the 4.1 pattern (table listing with export, auditor restrictions, admin review with status change) to ALL form pages across the system.

## Pattern to Apply (from 4.1 issues.tsx):
1. **Table listing**: Full text wrapping (no truncation), readable columns
2. **Export buttons**: Word, Excel, PDF using shared `client/src/lib/export-utils.ts` (exportToWord, exportToExcel, exportToPdf)
3. **Auditor restrictions**: Auditor cannot create/add new records (hide Add button, enforce on backend)
4. **Admin/Upper Management review**: Review button + dialog for admin/upper_management to review records, changing status to "completed"
5. **Edit by creator**: Creator can edit their own record until it's reviewed
6. **Created By tracking**: Store who created each record (createdBy + createdByName)

## Shared utility: `client/src/lib/export-utils.ts`
- `exportToWord(config)`, `exportToExcel(config)`, `exportToPdf(config)`
- Config: `{ title, clause, description, headers, rows, isRtl, filename }`

## Import pattern for each page:
```tsx
import { useAuth } from "@/hooks/use-auth";
import { exportToWord, exportToExcel, exportToPdf } from "@/lib/export-utils";
import { FileDown, FileSpreadsheet, FileText, Pencil, CheckCircle, ClipboardCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
```

## State/hooks pattern:
```tsx
const { t, i18n } = useTranslation();
const isRtl = i18n.language === "ar";
const { user } = useAuth();
const userRole = localStorage.getItem("userRole") || "user";
const canReview = userRole === "admin" || userRole === "upper_management";
const canCreate = userRole !== "auditor";
const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";
```

## DB Schema changes needed:
- Add `createdByName` text column to all tables that don't have it
- Add `reviewedById`, `reviewedByName`, `reviewedByRole`, `reviewDescription`, `reviewCompletedAt` columns to tables that don't have them
- Backend routes: store createdBy/createdByName on POST, add review authorization on PATCH

## Translation keys pattern (add to both en.json and ar.json under each section):
- `createdBy`, `editX`, `exportWord`, `exportExcel`, `exportPdf`, `reviewX`, `reviewDetails`, `reviewedBy`, `reviewerRole`, `reviewDate`, `remarks`, `submitReview`

# Tasks

### T001: Add review/createdBy columns to ALL schema tables
- **Blocked By**: []
- **Details**:
  - In `shared/schema.ts`, add to each table that doesn't have them: `createdBy`, `createdByName`, `reviewedById`, `reviewedByName`, `reviewedByRole`, `reviewDescription`, `reviewCompletedAt`
  - Tables to update: `interestedParties`, `qmsProcesses`, `qmsScope`, `risks`, `qualityObjectives`, `changeRequests`, `employees`, `trainingRecords`, `documents`, `suppliers`, `supplierEvaluations`, `audits`, `auditFindings`, `managementReviews`, `correctiveActions`, `improvements`, `leadershipCommitments`, `qualityPolicy`, `organizationRoles`, `operationalPlanning`, `customerRequirements`, `productRelease`, `nonconformingOutputs`, `deliveryActivities`, `performanceAnalysis`, `customerSatisfaction`, `innovationInitiatives`, `improvementIdeas`, `jobDescriptions`
  - Run SQL ALTER TABLE for each to add the new columns
  - In `server/storage.ts`, add `getXxx(id)` methods for each table that doesn't have one
  - In `server/routes.ts`, update POST routes to capture createdBy/createdByName from session, block auditor role; update PATCH routes to enforce creator-only edit (before review) and admin/upper_management-only review
  - Files: `shared/schema.ts`, `server/storage.ts`, `server/routes.ts`
  - Acceptance: All tables have the new columns, backend enforces authorization

### T002: Update Context pages (4.2 parties, 4.3 scope, 4.4 processes)
- **Blocked By**: [T001]
- **Details**:
  - Apply the full 4.1 pattern to: `client/src/pages/context/parties.tsx`, `client/src/pages/context/scope.tsx`, `client/src/pages/context/processes.tsx`
  - Each page gets: export buttons (Word/Excel/PDF), auditor can't create, review flow for admin/upper_mgmt, edit for creator, createdBy display in review popup, full text wrapping
  - Use `exportToWord/exportToExcel/exportToPdf` from `@/lib/export-utils`
  - Files: `client/src/pages/context/parties.tsx`, `client/src/pages/context/scope.tsx`, `client/src/pages/context/processes.tsx`

### T003: Update Leadership pages (5.1 commitment, 5.2 policy, 5.3 roles)
- **Blocked By**: [T001]
- **Details**:
  - Apply full 4.1 pattern to: `client/src/pages/leadership/commitment.tsx`, `client/src/pages/leadership/policy.tsx`, `client/src/pages/leadership/roles.tsx`
  - Same pattern as T002
  - Files: `client/src/pages/leadership/commitment.tsx`, `client/src/pages/leadership/policy.tsx`, `client/src/pages/leadership/roles.tsx`

### T004: Update Planning pages (6.1 risks, 6.2 objectives, 6.3 changes)
- **Blocked By**: [T001]
- **Details**:
  - Apply full 4.1 pattern to: `client/src/pages/planning/risks.tsx`, `client/src/pages/planning/objectives.tsx`, `client/src/pages/planning/changes.tsx`
  - Files: `client/src/pages/planning/risks.tsx`, `client/src/pages/planning/objectives.tsx`, `client/src/pages/planning/changes.tsx`

### T005: Update Support pages (7.1 resources, 7.2 competence, 7.5 documents)
- **Blocked By**: [T001]
- **Details**:
  - Apply full 4.1 pattern to: `client/src/pages/support/resources.tsx`, `client/src/pages/support/competence.tsx`, `client/src/pages/support/documents.tsx`
  - Files: `client/src/pages/support/resources.tsx`, `client/src/pages/support/competence.tsx`, `client/src/pages/support/documents.tsx`

### T006: Update Operation pages (8.1 planning, 8.2 requirements, 8.4 suppliers, 8.5 delivery, 8.6 release, 8.7 nonconforming)
- **Blocked By**: [T001]
- **Details**:
  - Apply full 4.1 pattern to: `client/src/pages/operation/planning.tsx`, `client/src/pages/operation/requirements.tsx`, `client/src/pages/operation/suppliers.tsx`, `client/src/pages/operation/delivery.tsx`, `client/src/pages/operation/release.tsx`, `client/src/pages/operation/nonconforming.tsx`
  - Files: listed above

### T007: Update Performance pages (9.1 analysis, 9.2 audits, 9.3 reviews, 9.4 satisfaction)
- **Blocked By**: [T001]
- **Details**:
  - Apply full 4.1 pattern to: `client/src/pages/performance/analysis.tsx`, `client/src/pages/performance/audits.tsx`, `client/src/pages/performance/reviews.tsx`, `client/src/pages/performance/satisfaction.tsx`
  - Files: listed above

### T008: Update Improvement pages (10.1 framework, 10.2 car, 10.3 ideas, 10.4 innovation)
- **Blocked By**: [T001]
- **Details**:
  - Apply full 4.1 pattern to: `client/src/pages/improvement/framework.tsx`, `client/src/pages/improvement/car.tsx`, `client/src/pages/improvement/ideas.tsx`, `client/src/pages/improvement/innovation.tsx`
  - Files: listed above

### T009: Add all missing translation keys
- **Blocked By**: [T002, T003, T004, T005, T006, T007, T008]
- **Details**:
  - Add export/review/edit translation keys for ALL modules in both `client/src/locales/en.json` and `client/src/locales/ar.json`
  - Files: `client/src/locales/en.json`, `client/src/locales/ar.json`
