import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"), // admin, quality_manager, auditor, user
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow(),
});

// SMTP Settings (admin-only)
export const smtpSettings = pgTable("smtp_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  host: text("host").notNull(),
  port: integer("port").notNull().default(587),
  secure: boolean("secure").notNull().default(false),
  username: text("username").notNull(),
  password: text("password").notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name").notNull().default("QMS Pro"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by"),
});

export const insertSmtpSettingsSchema = createInsertSchema(smtpSettings).omit({ id: true, updatedAt: true });
export type InsertSmtpSettings = z.infer<typeof insertSmtpSettingsSchema>;
export type SmtpSettings = typeof smtpSettings.$inferSelect;

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clause 4.1 - Context: Internal & External Issues
export const contextIssues = pgTable("context_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueType: text("issue_type").notNull(), // internal, external
  category: text("category").notNull(),
  description: text("description").notNull(),
  impact: text("impact"),
  action: text("action"), // action to be taken
  status: text("status").notNull().default("active"), // active, resolved, monitoring, completed
  reviewDate: timestamp("review_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Review fields
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  linkedToStrategicObjectives: text("linked_to_strategic_objectives"), // yes, no
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 4.2 - Interested Parties
export const interestedParties = pgTable("interested_parties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  partyType: text("party_type").notNull(), // customer, supplier, regulator, employee, shareholder
  requirements: text("requirements"),
  expectations: text("expectations"),
  followUpMethod: text("follow_up_method"),
  impact: text("impact"), // high, medium, low
  reviewStatus: text("review_status").notNull().default("pending"), // pending, reviewed, updated
  lastReviewDate: timestamp("last_review_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 4.4 - QMS Processes
export const qmsProcesses = pgTable("qms_processes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processName: text("process_name").notNull(),
  processOwner: text("process_owner").notNull(),
  inputs: text("inputs"),
  outputs: text("outputs"),
  kpis: text("kpis"),
  risks: text("risks"),
  department: text("department"),
  status: text("status").notNull().default("active"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 5.2 - Quality Policy
export const qualityPolicy = pgTable("quality_policy", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  version: text("version").notNull(),
  status: text("status").notNull().default("draft"), // draft, pending_approval, approved, archived
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  effectiveDate: timestamp("effective_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 5.3 - Organization Roles
export const organizationRoles = pgTable("organization_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  responsibilities: text("responsibilities").notNull(),
  authorities: text("authorities"),
  reportingTo: text("reporting_to"),
  department: text("department"),
  reviewStatus: text("review_status").notNull().default("pending"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 6.1 - Risks & Opportunities
export const risks = pgTable("risks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  riskType: text("risk_type").notNull(), // risk, opportunity
  category: text("category").notNull(),
  likelihood: integer("likelihood").notNull(), // 1-5
  impact: integer("impact").notNull(), // 1-5
  riskScore: integer("risk_score"), // calculated: likelihood * impact
  mitigationPlan: text("mitigation_plan"),
  owner: text("owner").notNull(),
  status: text("status").notNull().default("open"), // open, in_progress, closed, monitoring
  actionDate: timestamp("action_date"),
  dueDate: timestamp("due_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 6.2 - Quality Objectives
export const qualityObjectives = pgTable("quality_objectives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  objectiveTitle: text("objective_title").notNull(),
  description: text("description"),
  targetValue: text("target_value").notNull(),
  currentValue: text("current_value"),
  unit: text("unit"),
  kpiFormula: text("kpi_formula"),
  owner: text("owner").notNull(),
  department: text("department"),
  frequency: text("frequency"), // weekly, monthly, quarterly, annually
  status: text("status").notNull().default("on_track"), // on_track, at_risk, behind, achieved
  startDate: timestamp("start_date"),
  targetDate: timestamp("target_date"),
  reviewComments: text("review_comments"),
  lastReviewDate: timestamp("last_review_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 6.3 - Change Management
export const changeRequests = pgTable("change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  changeTitle: text("change_title").notNull(),
  description: text("description").notNull(),
  changeType: text("change_type").notNull(), // process, document, system, product
  impactAssessment: text("impact_assessment"),
  affectedAreas: text("affected_areas"),
  requestedBy: varchar("requested_by"),
  approvedBy: varchar("approved_by"),
  reviewComments: text("review_comments"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, implemented
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  requestDate: timestamp("request_date").defaultNow(),
  approvalDate: timestamp("approval_date"),
  implementationDate: timestamp("implementation_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 4.3 - QMS Scope
export const qmsScope = pgTable("qms_scope", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scopeStatement: text("scope_statement").notNull(),
  applicableProcesses: text("applicable_processes"),
  exclusions: text("exclusions"),
  justification: text("justification"),
  version: text("version").notNull(),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  effectiveDate: timestamp("effective_date"),
  status: text("status").notNull().default("draft"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 5.1 - Leadership Commitment
export const leadershipCommitments = pgTable("leadership_commitments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commitmentType: text("commitment_type").notNull(),
  description: text("description").notNull(),
  responsibleLeader: text("responsible_leader").notNull(),
  evidence: text("evidence"),
  status: text("status").notNull().default("active"),
  reviewDate: timestamp("review_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 7.1 - Resources
export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceType: text("resource_type").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("available"),
  need: text("need"),
  action: text("action"),
  department: text("department"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

export const maintenanceRecords = pgTable("maintenance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  equipment: text("equipment").notNull(),
  maintenanceDate: timestamp("maintenance_date").notNull(),
  maintenanceType: text("maintenance_type").notNull(),
  responsible: text("responsible").notNull(),
  notes: text("notes"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  status: text("status").notNull().default("completed"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 7.2 - Job Descriptions
export const jobDescriptions = pgTable("job_descriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  tasks: text("tasks").notNull(),
  qualifications: text("qualifications").notNull(),
  kpi: text("kpi"),
  approvalDate: timestamp("approval_date"),
  department: text("department"),
  status: text("status").notNull().default("active"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 7.2 - Performance Evaluations
export const performanceEvaluations = pgTable("performance_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  objectives: text("objectives").notNull(),
  evaluation: text("evaluation").notNull(),
  improvement: text("improvement"),
  decision: text("decision"),
  duration: text("duration"),
  evaluationDate: timestamp("evaluation_date").notNull(),
  evaluatedBy: text("evaluated_by"),
  status: text("status").notNull().default("completed"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 7.2 - Competence & Training
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: text("employee_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  department: text("department").notNull(),
  position: text("position").notNull(),
  hireDate: timestamp("hire_date"),
  contractType: text("contract_type"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

export const trainingRecords = pgTable("training_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  trainingTitle: text("training_title").notNull(),
  trainingType: text("training_type").notNull(), // internal, external, online, on_the_job
  description: text("description"),
  trainer: text("trainer"),
  trainingDate: timestamp("training_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  status: text("status").notNull().default("completed"), // scheduled, in_progress, completed, expired
  effectiveness: text("effectiveness"), // effective, partially_effective, not_effective
  certificate: text("certificate"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 7.3 - Awareness
export const awarenessRecords = pgTable("awareness_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topic: text("topic").notNull(),
  description: text("description").notNull(),
  targetAudience: text("target_audience"),
  method: text("method"),
  date: timestamp("date"),
  status: text("status").notNull().default("planned"),
  evidence: text("evidence"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 7.4 - Communication
export const communicationRecords = pgTable("communication_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  party: text("party").notNull(),
  subject: text("subject").notNull(),
  method: text("method").notNull(),
  result: text("result"),
  followUp: text("follow_up"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 7.5 - Document Control
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentNumber: text("document_number").notNull().unique(),
  title: text("title").notNull(),
  documentType: text("document_type").notNull(), // policy, procedure, work_instruction, form, record
  category: text("category"),
  version: text("version").notNull(),
  status: text("status").notNull().default("draft"), // draft, pending_review, approved, obsolete
  content: text("content"),
  department: text("department"),
  owner: text("owner").notNull(),
  reviewedBy: varchar("reviewed_by"),
  approvedBy: varchar("approved_by"),
  effectiveDate: timestamp("effective_date"),
  reviewDate: timestamp("review_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 8.1 - Operational Planning
export const operationalPlans = pgTable("operational_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planTitle: text("plan_title").notNull(),
  objectives: text("objectives").notNull(),
  resources: text("resources"),
  timeline: text("timeline"),
  responsible: text("responsible"),
  risks: text("risks"),
  status: text("status").notNull().default("planned"),
  reviewDate: timestamp("review_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 8.2 - Customer Requirements (Individual Plans)
export const customerRequirements = pgTable("customer_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  beneficiary: text("beneficiary").notNull(),
  objective: text("objective").notNull(),
  plan: text("plan").notNull(),
  duration: text("duration"),
  evaluation: text("evaluation"),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date"),
  reviewDate: timestamp("review_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 8.5 - Service Provision (Service Delivery)
export const serviceDelivery = pgTable("service_delivery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  beneficiary: text("beneficiary").notNull(),
  service: text("service").notNull(),
  description: text("description"),
  employee: text("employee").notNull(),
  duration: text("duration"),
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 8.6 - Release of Service
export const serviceReleases = pgTable("service_releases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id"),
  releaseDate: timestamp("release_date").notNull(),
  approvedBy: text("approved_by").notNull(),
  criteria: text("criteria"),
  verificationResult: text("verification_result"),
  status: text("status").notNull().default("approved"),
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 8.7 - Nonconforming Outputs (Complaints + Nonconformity)
export const complaints = pgTable("complaints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: text("number").notNull().unique(),
  date: timestamp("date").notNull(),
  complainant: text("complainant"),
  complaint: text("complaint").notNull(),
  action: text("action"),
  responsible: text("responsible"),
  status: text("status").notNull().default("open"),
  closureDate: timestamp("closure_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

export const nonconformities = pgTable("nonconformities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  cause: text("cause"),
  action: text("action"),
  closure: text("closure"),
  status: text("status").notNull().default("open"),
  closureDate: timestamp("closure_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 10.1 - Improvement (General)
export const improvementFramework = pgTable("improvement_framework", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  area: text("area").notNull(),
  currentState: text("current_state").notNull(),
  targetState: text("target_state"),
  actions: text("actions"),
  metrics: text("metrics"),
  responsible: text("responsible"),
  status: text("status").notNull().default("identified"),
  priority: text("priority").notNull().default("medium"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Personal Documents/Images Storage
export const personalDocuments = pgTable("personal_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  fileData: text("file_data"),
  category: text("category"),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clause 8.4 - Supplier Management
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierCode: text("supplier_code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  rating: integer("rating"), // 1-5
  status: text("status").notNull().default("active"), // active, inactive, blacklisted, pending_approval
  qualificationDate: timestamp("qualification_date"),
  lastEvaluationDate: timestamp("last_evaluation_date"),
  nextEvaluationDate: timestamp("next_evaluation_date"),
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

export const supplierEvaluations = pgTable("supplier_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull(),
  evaluationDate: timestamp("evaluation_date").notNull(),
  qualityScore: integer("quality_score"), // 1-100
  deliveryScore: integer("delivery_score"), // 1-100
  priceScore: integer("price_score"), // 1-100
  overallScore: integer("overall_score"), // calculated average
  evaluatedBy: varchar("evaluated_by"),
  comments: text("comments"),
  recommendation: text("recommendation"), // continue, conditional, terminate
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 9.2 - Internal Audit
export const audits = pgTable("audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditNumber: text("audit_number").notNull().unique(),
  auditType: text("audit_type").notNull(), // internal, external, supplier
  scope: text("scope").notNull(),
  department: text("department"),
  plannedDate: timestamp("planned_date").notNull(),
  actualDate: timestamp("actual_date"),
  leadAuditor: text("lead_auditor").notNull(),
  auditTeam: text("audit_team"),
  status: text("status").notNull().default("planned"), // planned, in_progress, completed, cancelled
  conclusion: text("conclusion"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

export const auditFindings = pgTable("audit_findings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditId: varchar("audit_id").notNull(),
  findingNumber: text("finding_number").notNull(),
  findingType: text("finding_type").notNull(), // major_nc, minor_nc, observation, opportunity
  clauseReference: text("clause_reference"),
  description: text("description").notNull(),
  evidence: text("evidence"),
  assignedTo: text("assigned_to"),
  status: text("status").notNull().default("open"), // open, in_progress, closed, verified
  dueDate: timestamp("due_date"),
  closedDate: timestamp("closed_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 9.3 - Management Review
export const managementReviews = pgTable("management_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewNumber: text("review_number").notNull().unique(),
  reviewDate: timestamp("review_date").notNull(),
  attendees: text("attendees"),
  agendaItems: text("agenda_items"),
  inputs: text("inputs"),
  outputs: text("outputs"),
  decisions: text("decisions"),
  actionItems: text("action_items"),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  conductedBy: text("conducted_by"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 10.2 - Corrective Actions (NCRs)
export const correctiveActions = pgTable("corrective_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  carNumber: text("car_number").notNull().unique(),
  title: text("title").notNull(),
  source: text("source").notNull(), // audit, customer_complaint, internal, supplier
  description: text("description").notNull(),
  rootCause: text("root_cause"),
  rootCauseMethod: text("root_cause_method"), // 5_why, fishbone, pareto
  immediateAction: text("immediate_action"),
  correctiveAction: text("corrective_action"),
  preventiveAction: text("preventive_action"),
  responsiblePerson: text("responsible_person").notNull(),
  department: text("department"),
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  status: text("status").notNull().default("open"), // open, root_cause_analysis, action_planned, implemented, verified, closed
  dueDate: timestamp("due_date"),
  closedDate: timestamp("closed_date"),
  verifiedBy: varchar("verified_by"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 10.3 - Continual Improvement
export const improvements = pgTable("improvements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // process, product, service, cost_reduction
  submittedBy: varchar("submitted_by"),
  department: text("department"),
  expectedBenefit: text("expected_benefit"),
  actualBenefit: text("actual_benefit"),
  status: text("status").notNull().default("submitted"), // submitted, under_review, approved, implemented, rejected
  priority: text("priority").notNull().default("medium"),
  implementationDate: timestamp("implementation_date"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Dashboard KPI Summary
export const kpiMetrics = pgTable("kpi_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricName: text("metric_name").notNull(),
  metricValue: text("metric_value").notNull(),
  targetValue: text("target_value"),
  unit: text("unit"),
  period: text("period"), // monthly, quarterly, yearly
  periodDate: timestamp("period_date"),
  trend: text("trend"), // up, down, stable
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const employeeRelations = relations(employees, ({ many }) => ({
  trainingRecords: many(trainingRecords),
}));

export const trainingRecordRelations = relations(trainingRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [trainingRecords.employeeId],
    references: [employees.id],
  }),
}));

export const supplierRelations = relations(suppliers, ({ many }) => ({
  evaluations: many(supplierEvaluations),
}));

export const supplierEvaluationRelations = relations(supplierEvaluations, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierEvaluations.supplierId],
    references: [suppliers.id],
  }),
}));

export const auditRelations = relations(audits, ({ many }) => ({
  findings: many(auditFindings),
}));

export const auditFindingRelations = relations(auditFindings, ({ one }) => ({
  audit: one(audits, {
    fields: [auditFindings.auditId],
    references: [audits.id],
  }),
}));

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  module: text("module").notNull(),
  clauseRef: text("clause_ref").notNull(),
  title: text("title").notNull(),
  entityId: varchar("entity_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clause 9.1 - Performance Analysis
export const performanceAnalysis = pgTable("performance_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  indicator: text("indicator").notNull(),
  value: text("value").notNull(),
  target: text("target").notNull(),
  status: text("status").notNull().default("on_track"),
  action: text("action"),
  reviewedBy: text("reviewed_by"),
  reviewDate: timestamp("review_date"),
  allowedReviewRoles: text("allowed_review_roles").array(),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription2: text("review_description_2"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 9.4 - Customer Satisfaction
export const customerSatisfaction = pgTable("customer_satisfaction", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timePeriod: text("time_period").notNull(),
  tool: text("tool").notNull(),
  outcome: text("outcome").notNull(),
  improvement: text("improvement"),
  reviewedBy: text("reviewed_by"),
  reviewDate: timestamp("review_date"),
  allowedReviewRoles: text("allowed_review_roles").array(),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription2: text("review_description_2"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Clause 10.4 - Innovation Initiatives
export const innovationInitiatives = pgTable("innovation_initiatives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  date: timestamp("date"),
  type: text("type").notNull().default("process"),
  impact: text("impact").notNull().default("medium"),
  status: text("status").notNull().default("proposed"),
  submittedBy: text("submitted_by"),
  department: text("department"),
  expectedOutcome: text("expected_outcome"),
  createdBy: varchar("created_by"),
  createdByName: text("created_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedById: varchar("reviewed_by_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedByRole: text("reviewed_by_role"),
  reviewDescription: text("review_description"),
  reviewCompletedAt: timestamp("review_completed_at"),
});

// Review Update & Log
export const reviewUpdateLog = pgTable("review_update_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewNumber: text("review_number").notNull(),
  date: timestamp("date"),
  descriptionOfAmendment: text("description_of_amendment").notNull(),
  reasonForAmendment: text("reason_for_amendment"),
  concernedParty: text("concerned_party"),
  approvedBy: text("approved_by"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Evidence Files (polymorphic - for any module)
export const evidenceFiles = pgTable("evidence_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  module: text("module").notNull(),
  entityId: varchar("entity_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  fileData: text("file_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Role Permissions (per-submenu access control)
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(),
  submenu: text("submenu").notNull(),
  canAccess: boolean("can_access").notNull().default(true),
});

// Leadership KPI Data (manual entry for 5.1 and 5.3 indicators)
export const leadershipKpiData = pgTable("leadership_kpi_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  section: text("section").notNull(),
  indicator: text("indicator").notNull(),
  measurementMethod: text("measurement_method").notNull(),
  target: text("target").notNull(),
  actualValue: text("actual_value"),
  period: text("period"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertContextIssueSchema = createInsertSchema(contextIssues).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInterestedPartySchema = createInsertSchema(interestedParties).omit({ id: true, createdAt: true });
export const insertQmsProcessSchema = createInsertSchema(qmsProcesses).omit({ id: true, createdAt: true });
export const insertQualityPolicySchema = createInsertSchema(qualityPolicy).omit({ id: true, createdAt: true });
export const insertRiskSchema = createInsertSchema(risks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQualityObjectiveSchema = createInsertSchema(qualityObjectives).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChangeRequestSchema = createInsertSchema(changeRequests).omit({ id: true, createdAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true });
export const insertTrainingRecordSchema = createInsertSchema(trainingRecords).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertSupplierEvaluationSchema = createInsertSchema(supplierEvaluations).omit({ id: true, createdAt: true });
export const insertAuditSchema = createInsertSchema(audits).omit({ id: true, createdAt: true });
export const insertAuditFindingSchema = createInsertSchema(auditFindings).omit({ id: true, createdAt: true });
export const insertManagementReviewSchema = createInsertSchema(managementReviews).omit({ id: true, createdAt: true });
export const insertCorrectiveActionSchema = createInsertSchema(correctiveActions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertImprovementSchema = createInsertSchema(improvements).omit({ id: true, createdAt: true });
export const insertKpiMetricSchema = createInsertSchema(kpiMetrics).omit({ id: true, createdAt: true });

// New Insert Schemas for missing clauses
export const insertQmsScopeSchema = createInsertSchema(qmsScope).omit({ id: true, createdAt: true });
export const insertLeadershipCommitmentSchema = createInsertSchema(leadershipCommitments).omit({ id: true, createdAt: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true });
export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({ id: true, createdAt: true });
export const insertJobDescriptionSchema = createInsertSchema(jobDescriptions).omit({ id: true, createdAt: true });
export const insertPerformanceEvaluationSchema = createInsertSchema(performanceEvaluations).omit({ id: true, createdAt: true });
export const insertAwarenessRecordSchema = createInsertSchema(awarenessRecords).omit({ id: true, createdAt: true });
export const insertCommunicationRecordSchema = createInsertSchema(communicationRecords).omit({ id: true, createdAt: true });
export const insertOperationalPlanSchema = createInsertSchema(operationalPlans).omit({ id: true, createdAt: true });
export const insertCustomerRequirementSchema = createInsertSchema(customerRequirements).omit({ id: true, createdAt: true });
export const insertServiceDeliverySchema = createInsertSchema(serviceDelivery).omit({ id: true, createdAt: true });
export const insertServiceReleaseSchema = createInsertSchema(serviceReleases).omit({ id: true, createdAt: true });
export const insertComplaintSchema = createInsertSchema(complaints).omit({ id: true, createdAt: true });
export const insertNonconformitySchema = createInsertSchema(nonconformities).omit({ id: true, createdAt: true });
export const insertImprovementFrameworkSchema = createInsertSchema(improvementFramework).omit({ id: true, createdAt: true });
export const insertPersonalDocumentSchema = createInsertSchema(personalDocuments).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertEvidenceFileSchema = createInsertSchema(evidenceFiles).omit({ id: true, createdAt: true });
export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true });
export const insertLeadershipKpiDataSchema = createInsertSchema(leadershipKpiData).omit({ id: true, createdAt: true });
export const insertPerformanceAnalysisSchema = createInsertSchema(performanceAnalysis).omit({ id: true, createdAt: true });
export const insertCustomerSatisfactionSchema = createInsertSchema(customerSatisfaction).omit({ id: true, createdAt: true });
export const insertInnovationInitiativeSchema = createInsertSchema(innovationInitiatives).omit({ id: true, createdAt: true });
export const insertReviewUpdateLogSchema = createInsertSchema(reviewUpdateLog).omit({ id: true, createdAt: true });
export const insertOrganizationRoleSchema = createInsertSchema(organizationRoles).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertContextIssue = z.infer<typeof insertContextIssueSchema>;
export type ContextIssue = typeof contextIssues.$inferSelect;
export type InsertInterestedParty = z.infer<typeof insertInterestedPartySchema>;
export type InterestedParty = typeof interestedParties.$inferSelect;
export type InsertQmsProcess = z.infer<typeof insertQmsProcessSchema>;
export type QmsProcess = typeof qmsProcesses.$inferSelect;
export type InsertQualityPolicy = z.infer<typeof insertQualityPolicySchema>;
export type QualityPolicy = typeof qualityPolicy.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type Risk = typeof risks.$inferSelect;
export type InsertQualityObjective = z.infer<typeof insertQualityObjectiveSchema>;
export type QualityObjective = typeof qualityObjectives.$inferSelect;
export type InsertChangeRequest = z.infer<typeof insertChangeRequestSchema>;
export type ChangeRequest = typeof changeRequests.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertTrainingRecord = z.infer<typeof insertTrainingRecordSchema>;
export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplierEvaluation = z.infer<typeof insertSupplierEvaluationSchema>;
export type SupplierEvaluation = typeof supplierEvaluations.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof audits.$inferSelect;
export type InsertAuditFinding = z.infer<typeof insertAuditFindingSchema>;
export type AuditFinding = typeof auditFindings.$inferSelect;
export type InsertManagementReview = z.infer<typeof insertManagementReviewSchema>;
export type ManagementReview = typeof managementReviews.$inferSelect;
export type InsertCorrectiveAction = z.infer<typeof insertCorrectiveActionSchema>;
export type CorrectiveAction = typeof correctiveActions.$inferSelect;
export type InsertImprovement = z.infer<typeof insertImprovementSchema>;
export type Improvement = typeof improvements.$inferSelect;
export type InsertKpiMetric = z.infer<typeof insertKpiMetricSchema>;
export type KpiMetric = typeof kpiMetrics.$inferSelect;

// New Types for missing clauses
export type InsertQmsScope = z.infer<typeof insertQmsScopeSchema>;
export type QmsScope = typeof qmsScope.$inferSelect;
export type InsertLeadershipCommitment = z.infer<typeof insertLeadershipCommitmentSchema>;
export type LeadershipCommitment = typeof leadershipCommitments.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertJobDescription = z.infer<typeof insertJobDescriptionSchema>;
export type JobDescription = typeof jobDescriptions.$inferSelect;
export type InsertPerformanceEvaluation = z.infer<typeof insertPerformanceEvaluationSchema>;
export type PerformanceEvaluation = typeof performanceEvaluations.$inferSelect;
export type InsertAwarenessRecord = z.infer<typeof insertAwarenessRecordSchema>;
export type AwarenessRecord = typeof awarenessRecords.$inferSelect;
export type InsertCommunicationRecord = z.infer<typeof insertCommunicationRecordSchema>;
export type CommunicationRecord = typeof communicationRecords.$inferSelect;
export type InsertOperationalPlan = z.infer<typeof insertOperationalPlanSchema>;
export type OperationalPlan = typeof operationalPlans.$inferSelect;
export type InsertCustomerRequirement = z.infer<typeof insertCustomerRequirementSchema>;
export type CustomerRequirement = typeof customerRequirements.$inferSelect;
export type InsertServiceDelivery = z.infer<typeof insertServiceDeliverySchema>;
export type ServiceDeliveryRecord = typeof serviceDelivery.$inferSelect;
export type InsertServiceRelease = z.infer<typeof insertServiceReleaseSchema>;
export type ServiceRelease = typeof serviceReleases.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaints.$inferSelect;
export type InsertNonconformity = z.infer<typeof insertNonconformitySchema>;
export type Nonconformity = typeof nonconformities.$inferSelect;
export type InsertImprovementFramework = z.infer<typeof insertImprovementFrameworkSchema>;
export type ImprovementFramework = typeof improvementFramework.$inferSelect;
export type InsertPersonalDocument = z.infer<typeof insertPersonalDocumentSchema>;
export type PersonalDocument = typeof personalDocuments.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertEvidenceFile = z.infer<typeof insertEvidenceFileSchema>;
export type EvidenceFile = typeof evidenceFiles.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertLeadershipKpiData = z.infer<typeof insertLeadershipKpiDataSchema>;
export type LeadershipKpiData = typeof leadershipKpiData.$inferSelect;
export type InsertPerformanceAnalysis = z.infer<typeof insertPerformanceAnalysisSchema>;
export type PerformanceAnalysis = typeof performanceAnalysis.$inferSelect;
export type InsertCustomerSatisfaction = z.infer<typeof insertCustomerSatisfactionSchema>;
export type CustomerSatisfaction = typeof customerSatisfaction.$inferSelect;
export type InsertInnovationInitiative = z.infer<typeof insertInnovationInitiativeSchema>;
export type InnovationInitiative = typeof innovationInitiatives.$inferSelect;
export type InsertReviewUpdateLog = z.infer<typeof insertReviewUpdateLogSchema>;
export type ReviewUpdateLog = typeof reviewUpdateLog.$inferSelect;
export type InsertOrganizationRole = z.infer<typeof insertOrganizationRoleSchema>;
export type OrganizationRole = typeof organizationRoles.$inferSelect;
