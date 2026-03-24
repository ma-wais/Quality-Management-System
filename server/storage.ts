import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import {
  users,
  contextIssues,
  interestedParties,
  qmsProcesses,
  qualityPolicy,
  risks,
  qualityObjectives,
  changeRequests,
  employees,
  trainingRecords,
  documents,
  suppliers,
  supplierEvaluations,
  audits,
  auditFindings,
  managementReviews,
  correctiveActions,
  improvements,
  kpiMetrics,
  qmsScope,
  leadershipCommitments,
  resources,
  maintenanceRecords,
  jobDescriptions,
  performanceEvaluations,
  awarenessRecords,
  communicationRecords,
  operationalPlans,
  customerRequirements,
  serviceDelivery,
  serviceReleases,
  complaints,
  nonconformities,
  improvementFramework,
  personalDocuments,
  notifications,
  type User,
  type InsertUser,
  type ContextIssue,
  type InsertContextIssue,
  type InterestedParty,
  type InsertInterestedParty,
  type QmsProcess,
  type InsertQmsProcess,
  type QualityPolicy,
  type InsertQualityPolicy,
  type Risk,
  type InsertRisk,
  type QualityObjective,
  type InsertQualityObjective,
  type ChangeRequest,
  type InsertChangeRequest,
  type Employee,
  type InsertEmployee,
  type TrainingRecord,
  type InsertTrainingRecord,
  type Document,
  type InsertDocument,
  type Supplier,
  type InsertSupplier,
  type SupplierEvaluation,
  type InsertSupplierEvaluation,
  type Audit,
  type InsertAudit,
  type AuditFinding,
  type InsertAuditFinding,
  type ManagementReview,
  type InsertManagementReview,
  type CorrectiveAction,
  type InsertCorrectiveAction,
  type Improvement,
  type InsertImprovement,
  type KpiMetric,
  type InsertKpiMetric,
  type QmsScope,
  type InsertQmsScope,
  type LeadershipCommitment,
  type InsertLeadershipCommitment,
  type Resource,
  type InsertResource,
  type MaintenanceRecord,
  type InsertMaintenanceRecord,
  type JobDescription,
  type InsertJobDescription,
  type PerformanceEvaluation,
  type InsertPerformanceEvaluation,
  type AwarenessRecord,
  type InsertAwarenessRecord,
  type CommunicationRecord,
  type InsertCommunicationRecord,
  type OperationalPlan,
  type InsertOperationalPlan,
  type CustomerRequirement,
  type InsertCustomerRequirement,
  type ServiceDeliveryRecord,
  type InsertServiceDelivery,
  type ServiceRelease,
  type InsertServiceRelease,
  type Complaint,
  type InsertComplaint,
  type Nonconformity,
  type InsertNonconformity,
  type ImprovementFramework,
  type InsertImprovementFramework,
  type PersonalDocument,
  type InsertPersonalDocument,
  type Notification,
  type InsertNotification,
  evidenceFiles,
  type EvidenceFile,
  type InsertEvidenceFile,
  rolePermissions,
  type RolePermission,
  type InsertRolePermission,
  leadershipKpiData,
  type LeadershipKpiData,
  type InsertLeadershipKpiData,
  performanceAnalysis,
  type PerformanceAnalysis,
  type InsertPerformanceAnalysis,
  customerSatisfaction,
  type CustomerSatisfaction,
  type InsertCustomerSatisfaction,
  innovationInitiatives,
  type InnovationInitiative,
  type InsertInnovationInitiative,
  reviewUpdateLog,
  type ReviewUpdateLog,
  type InsertReviewUpdateLog,
  organizationRoles,
  type OrganizationRole,
  type InsertOrganizationRole,
  smtpSettings,
  type SmtpSettings,
  type InsertSmtpSettings,
  passwordResetTokens,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Context Issues (4.1)
  getAllContextIssues(): Promise<ContextIssue[]>;
  getContextIssue(id: string): Promise<ContextIssue | undefined>;
  createContextIssue(issue: InsertContextIssue): Promise<ContextIssue>;
  updateContextIssue(id: string, issue: Partial<InsertContextIssue>): Promise<ContextIssue | undefined>;

  // Interested Parties (4.2)
  getAllInterestedParties(): Promise<InterestedParty[]>;
  getInterestedParty(id: string): Promise<InterestedParty | undefined>;
  createInterestedParty(party: InsertInterestedParty): Promise<InterestedParty>;
  updateInterestedParty(id: string, data: Partial<InsertInterestedParty>): Promise<InterestedParty | undefined>;

  // QMS Processes (4.4)
  getAllQmsProcesses(): Promise<QmsProcess[]>;
  getQmsProcess(id: string): Promise<QmsProcess | undefined>;
  createQmsProcess(process: InsertQmsProcess): Promise<QmsProcess>;
  updateQmsProcess(id: string, data: Partial<InsertQmsProcess>): Promise<QmsProcess | undefined>;

  // Quality Policy (5.2)
  getAllQualityPolicies(): Promise<QualityPolicy[]>;
  getQualityPolicyById(id: string): Promise<QualityPolicy | undefined>;
  createQualityPolicy(policy: InsertQualityPolicy): Promise<QualityPolicy>;
  approveQualityPolicy(id: string): Promise<QualityPolicy | undefined>;
  updateQualityPolicy(id: string, data: Partial<InsertQualityPolicy>): Promise<QualityPolicy | undefined>;

  // Organization Roles (5.3)
  getAllOrganizationRoles(): Promise<OrganizationRole[]>;
  getOrganizationRole(id: string): Promise<OrganizationRole | undefined>;
  createOrganizationRole(role: InsertOrganizationRole): Promise<OrganizationRole>;
  updateOrganizationRole(id: string, data: Partial<InsertOrganizationRole>): Promise<OrganizationRole | undefined>;

  // Risks (6.1)
  getAllRisks(): Promise<Risk[]>;
  getRisk(id: string): Promise<Risk | undefined>;
  createRisk(risk: InsertRisk): Promise<Risk>;
  updateRisk(id: string, data: Partial<InsertRisk>): Promise<Risk | undefined>;

  // Quality Objectives (6.2)
  getAllQualityObjectives(): Promise<QualityObjective[]>;
  getQualityObjective(id: string): Promise<QualityObjective | undefined>;
  createQualityObjective(objective: InsertQualityObjective): Promise<QualityObjective>;
  updateQualityObjective(id: string, data: Partial<InsertQualityObjective>): Promise<QualityObjective | undefined>;

  // Change Requests (6.3)
  getAllChangeRequests(): Promise<ChangeRequest[]>;
  getChangeRequest(id: string): Promise<ChangeRequest | undefined>;
  createChangeRequest(request: InsertChangeRequest): Promise<ChangeRequest>;
  updateChangeRequest(id: string, data: Partial<InsertChangeRequest>): Promise<ChangeRequest | undefined>;

  // Employees (7.2)
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined>;

  // Training Records (7.2)
  getAllTrainingRecords(): Promise<TrainingRecord[]>;
  getTrainingRecord(id: string): Promise<TrainingRecord | undefined>;
  createTrainingRecord(record: InsertTrainingRecord): Promise<TrainingRecord>;
  updateTrainingRecord(id: string, data: Partial<InsertTrainingRecord>): Promise<TrainingRecord | undefined>;

  // Documents (7.5)
  getAllDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>;
  approveDocument(id: string): Promise<Document | undefined>;

  // Suppliers (8.4)
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, data: Partial<InsertSupplier>): Promise<Supplier | undefined>;

  // Supplier Evaluations (8.4)
  getAllSupplierEvaluations(): Promise<SupplierEvaluation[]>;
  getSupplierEvaluation(id: string): Promise<SupplierEvaluation | undefined>;
  createSupplierEvaluation(evaluation: InsertSupplierEvaluation): Promise<SupplierEvaluation>;
  updateSupplierEvaluation(id: string, data: Partial<InsertSupplierEvaluation>): Promise<SupplierEvaluation | undefined>;

  // Audits (9.2)
  getAllAudits(): Promise<Audit[]>;
  getAudit(id: string): Promise<Audit | undefined>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  updateAudit(id: string, data: Partial<InsertAudit>): Promise<Audit | undefined>;

  // Audit Findings (9.2)
  getAllAuditFindings(): Promise<AuditFinding[]>;
  getAuditFinding(id: string): Promise<AuditFinding | undefined>;
  createAuditFinding(finding: InsertAuditFinding): Promise<AuditFinding>;
  updateAuditFinding(id: string, data: Partial<InsertAuditFinding>): Promise<AuditFinding | undefined>;

  // Management Reviews (9.3)
  getAllManagementReviews(): Promise<ManagementReview[]>;
  getManagementReview(id: string): Promise<ManagementReview | undefined>;
  createManagementReview(review: InsertManagementReview): Promise<ManagementReview>;
  updateManagementReview(id: string, data: Partial<InsertManagementReview>): Promise<ManagementReview | undefined>;

  // Corrective Actions (10.2)
  getAllCorrectiveActions(): Promise<CorrectiveAction[]>;
  getCorrectiveAction(id: string): Promise<CorrectiveAction | undefined>;
  createCorrectiveAction(action: InsertCorrectiveAction): Promise<CorrectiveAction>;
  updateCorrectiveAction(id: string, action: Partial<InsertCorrectiveAction>): Promise<CorrectiveAction | undefined>;

  // Improvements (10.3)
  getAllImprovements(): Promise<Improvement[]>;
  getImprovement(id: string): Promise<Improvement | undefined>;
  createImprovement(improvement: InsertImprovement): Promise<Improvement>;
  updateImprovement(id: string, data: Partial<InsertImprovement>): Promise<Improvement | undefined>;

  // KPI Metrics
  getAllKpiMetrics(): Promise<KpiMetric[]>;
  createKpiMetric(metric: InsertKpiMetric): Promise<KpiMetric>;

  // QMS Scope (4.3)
  getAllQmsScopes(): Promise<QmsScope[]>;
  getQmsScopeById(id: string): Promise<QmsScope | undefined>;
  createQmsScope(scope: InsertQmsScope): Promise<QmsScope>;
  updateQmsScope(id: string, scope: Partial<InsertQmsScope>): Promise<QmsScope | undefined>;

  // Leadership Commitments (5.1)
  getAllLeadershipCommitments(): Promise<LeadershipCommitment[]>;
  getLeadershipCommitment(id: string): Promise<LeadershipCommitment | undefined>;
  createLeadershipCommitment(commitment: InsertLeadershipCommitment): Promise<LeadershipCommitment>;
  updateLeadershipCommitment(id: string, commitment: Partial<InsertLeadershipCommitment>): Promise<LeadershipCommitment | undefined>;

  // Resources (7.1)
  getAllResources(): Promise<Resource[]>;
  getResource(id: string): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: string, resource: Partial<InsertResource>): Promise<Resource | undefined>;

  // Maintenance Records (7.1)
  getAllMaintenanceRecords(): Promise<MaintenanceRecord[]>;
  getMaintenanceRecord(id: string): Promise<MaintenanceRecord | undefined>;
  createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord>;
  updateMaintenanceRecord(id: string, record: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord | undefined>;

  // Job Descriptions (7.2)
  getAllJobDescriptions(): Promise<JobDescription[]>;
  getJobDescription(id: string): Promise<JobDescription | undefined>;
  createJobDescription(job: InsertJobDescription): Promise<JobDescription>;
  updateJobDescription(id: string, data: Partial<InsertJobDescription>): Promise<JobDescription | undefined>;

  // Performance Evaluations (7.2)
  getAllPerformanceEvaluations(): Promise<PerformanceEvaluation[]>;
  getPerformanceEvaluation(id: string): Promise<PerformanceEvaluation | undefined>;
  createPerformanceEvaluation(evaluation: InsertPerformanceEvaluation): Promise<PerformanceEvaluation>;
  updatePerformanceEvaluation(id: string, data: Partial<InsertPerformanceEvaluation>): Promise<PerformanceEvaluation | undefined>;

  // Awareness Records (7.3)
  getAllAwarenessRecords(): Promise<AwarenessRecord[]>;
  getAwarenessRecord(id: string): Promise<AwarenessRecord | undefined>;
  createAwarenessRecord(record: InsertAwarenessRecord): Promise<AwarenessRecord>;
  updateAwarenessRecord(id: string, record: Partial<InsertAwarenessRecord>): Promise<AwarenessRecord | undefined>;

  // Communication Records (7.4)
  getAllCommunicationRecords(): Promise<CommunicationRecord[]>;
  getCommunicationRecord(id: string): Promise<CommunicationRecord | undefined>;
  createCommunicationRecord(record: InsertCommunicationRecord): Promise<CommunicationRecord>;
  updateCommunicationRecord(id: string, record: Partial<InsertCommunicationRecord>): Promise<CommunicationRecord | undefined>;

  // Operational Plans (8.1)
  getAllOperationalPlans(): Promise<OperationalPlan[]>;
  getOperationalPlan(id: string): Promise<OperationalPlan | undefined>;
  createOperationalPlan(plan: InsertOperationalPlan): Promise<OperationalPlan>;
  updateOperationalPlan(id: string, plan: Partial<InsertOperationalPlan>): Promise<OperationalPlan | undefined>;

  // Customer Requirements (8.2)
  getAllCustomerRequirements(): Promise<CustomerRequirement[]>;
  getCustomerRequirement(id: string): Promise<CustomerRequirement | undefined>;
  createCustomerRequirement(requirement: InsertCustomerRequirement): Promise<CustomerRequirement>;
  updateCustomerRequirement(id: string, requirement: Partial<InsertCustomerRequirement>): Promise<CustomerRequirement | undefined>;

  // Service Delivery (8.5)
  getAllServiceDelivery(): Promise<ServiceDeliveryRecord[]>;
  getServiceDeliveryById(id: string): Promise<ServiceDeliveryRecord | undefined>;
  createServiceDelivery(delivery: InsertServiceDelivery): Promise<ServiceDeliveryRecord>;
  updateServiceDelivery(id: string, delivery: Partial<InsertServiceDelivery>): Promise<ServiceDeliveryRecord | undefined>;

  // Service Releases (8.6)
  getAllServiceReleases(): Promise<ServiceRelease[]>;
  getServiceRelease(id: string): Promise<ServiceRelease | undefined>;
  createServiceRelease(release: InsertServiceRelease): Promise<ServiceRelease>;
  updateServiceRelease(id: string, release: Partial<InsertServiceRelease>): Promise<ServiceRelease | undefined>;

  // Complaints (8.7)
  getAllComplaints(): Promise<Complaint[]>;
  getComplaint(id: string): Promise<Complaint | undefined>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaint(id: string, complaint: Partial<InsertComplaint>): Promise<Complaint | undefined>;

  // Nonconformities (8.7)
  getAllNonconformities(): Promise<Nonconformity[]>;
  getNonconformity(id: string): Promise<Nonconformity | undefined>;
  createNonconformity(nc: InsertNonconformity): Promise<Nonconformity>;
  updateNonconformity(id: string, nc: Partial<InsertNonconformity>): Promise<Nonconformity | undefined>;

  // Improvement Framework (10.1)
  getAllImprovementFramework(): Promise<ImprovementFramework[]>;
  getImprovementFrameworkById(id: string): Promise<ImprovementFramework | undefined>;
  createImprovementFramework(item: InsertImprovementFramework): Promise<ImprovementFramework>;
  updateImprovementFramework(id: string, item: Partial<InsertImprovementFramework>): Promise<ImprovementFramework | undefined>;

  // Personal Documents
  getAllPersonalDocuments(): Promise<PersonalDocument[]>;
  createPersonalDocument(doc: InsertPersonalDocument): Promise<PersonalDocument>;
  deletePersonalDocument(id: string): Promise<boolean>;

  // Notifications
  getAllNotifications(): Promise<Notification[]>;
  getUnreadNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(): Promise<void>;

  // Evidence Files
  getEvidenceFiles(module: string, entityId: string): Promise<EvidenceFile[]>;
  createEvidenceFile(file: InsertEvidenceFile): Promise<EvidenceFile>;
  deleteEvidenceFile(id: string): Promise<boolean>;

  // Role Permissions
  getAllRolePermissions(): Promise<RolePermission[]>;
  getRolePermissions(role: string): Promise<RolePermission[]>;
  upsertRolePermission(permission: InsertRolePermission): Promise<RolePermission>;
  updateRolePermission(id: string, canAccess: boolean): Promise<RolePermission | undefined>;
  deleteAllRolePermissions(): Promise<void>;

  // Leadership KPI Data
  getAllLeadershipKpiData(): Promise<LeadershipKpiData[]>;
  getLeadershipKpiDataBySection(section: string): Promise<LeadershipKpiData[]>;
  createLeadershipKpiData(data: InsertLeadershipKpiData): Promise<LeadershipKpiData>;
  updateLeadershipKpiData(id: string, data: Partial<InsertLeadershipKpiData>): Promise<LeadershipKpiData | undefined>;
  deleteLeadershipKpiData(id: string): Promise<boolean>;

  // Performance Analysis (9.1)
  getAllPerformanceAnalysis(): Promise<PerformanceAnalysis[]>;
  getPerformanceAnalysisById(id: string): Promise<PerformanceAnalysis | undefined>;
  createPerformanceAnalysis(data: InsertPerformanceAnalysis): Promise<PerformanceAnalysis>;
  updatePerformanceAnalysis(id: string, data: Partial<InsertPerformanceAnalysis>): Promise<PerformanceAnalysis | undefined>;

  // Customer Satisfaction (9.4)
  getAllCustomerSatisfaction(): Promise<CustomerSatisfaction[]>;
  getCustomerSatisfactionById(id: string): Promise<CustomerSatisfaction | undefined>;
  createCustomerSatisfaction(data: InsertCustomerSatisfaction): Promise<CustomerSatisfaction>;
  updateCustomerSatisfaction(id: string, data: Partial<InsertCustomerSatisfaction>): Promise<CustomerSatisfaction | undefined>;

  // Innovation Initiatives (10.4)
  getAllInnovationInitiatives(): Promise<InnovationInitiative[]>;
  getInnovationInitiative(id: string): Promise<InnovationInitiative | undefined>;
  createInnovationInitiative(data: InsertInnovationInitiative): Promise<InnovationInitiative>;
  updateInnovationInitiative(id: string, data: Partial<InsertInnovationInitiative>): Promise<InnovationInitiative | undefined>;

  // Review Update & Log
  getAllReviewUpdateLogs(): Promise<ReviewUpdateLog[]>;
  createReviewUpdateLog(data: InsertReviewUpdateLog): Promise<ReviewUpdateLog>;

  // SMTP Settings
  getSmtpSettings(): Promise<SmtpSettings | undefined>;
  upsertSmtpSettings(data: InsertSmtpSettings): Promise<SmtpSettings>;

  // Password Reset Tokens
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{ id: string; userId: string; token: string; expiresAt: Date; used: boolean } | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Context Issues
  async getAllContextIssues(): Promise<ContextIssue[]> {
    return db.select().from(contextIssues);
  }

  async getContextIssue(id: string): Promise<ContextIssue | undefined> {
    const [result] = await db.select().from(contextIssues).where(eq(contextIssues.id, id));
    return result;
  }

  async createContextIssue(issue: InsertContextIssue): Promise<ContextIssue> {
    const [result] = await db.insert(contextIssues).values(issue).returning();
    return result;
  }

  async updateContextIssue(id: string, issue: Partial<InsertContextIssue>): Promise<ContextIssue | undefined> {
    const [result] = await db
      .update(contextIssues)
      .set({ ...issue, updatedAt: new Date() })
      .where(eq(contextIssues.id, id))
      .returning();
    return result;
  }

  // Interested Parties
  async getAllInterestedParties(): Promise<InterestedParty[]> {
    return db.select().from(interestedParties);
  }

  async getInterestedParty(id: string): Promise<InterestedParty | undefined> {
    const [result] = await db.select().from(interestedParties).where(eq(interestedParties.id, id));
    return result;
  }

  async createInterestedParty(party: InsertInterestedParty): Promise<InterestedParty> {
    const [result] = await db.insert(interestedParties).values(party).returning();
    return result;
  }

  async updateInterestedParty(id: string, data: Partial<InsertInterestedParty>): Promise<InterestedParty | undefined> {
    const [result] = await db.update(interestedParties).set(data).where(eq(interestedParties.id, id)).returning();
    return result;
  }

  // QMS Processes
  async getAllQmsProcesses(): Promise<QmsProcess[]> {
    return db.select().from(qmsProcesses);
  }

  async getQmsProcess(id: string): Promise<QmsProcess | undefined> {
    const [result] = await db.select().from(qmsProcesses).where(eq(qmsProcesses.id, id));
    return result;
  }

  async createQmsProcess(process: InsertQmsProcess): Promise<QmsProcess> {
    const [result] = await db.insert(qmsProcesses).values(process).returning();
    return result;
  }

  async updateQmsProcess(id: string, data: Partial<InsertQmsProcess>): Promise<QmsProcess | undefined> {
    const [result] = await db.update(qmsProcesses).set(data).where(eq(qmsProcesses.id, id)).returning();
    return result;
  }

  // Quality Policy
  async getAllQualityPolicies(): Promise<QualityPolicy[]> {
    return db.select().from(qualityPolicy);
  }

  async getQualityPolicyById(id: string): Promise<QualityPolicy | undefined> {
    const [result] = await db.select().from(qualityPolicy).where(eq(qualityPolicy.id, id));
    return result;
  }

  async createQualityPolicy(policy: InsertQualityPolicy): Promise<QualityPolicy> {
    const [result] = await db.insert(qualityPolicy).values(policy).returning();
    return result;
  }

  async approveQualityPolicy(id: string): Promise<QualityPolicy | undefined> {
    const [result] = await db
      .update(qualityPolicy)
      .set({
        status: "approved",
        approvedAt: new Date(),
        effectiveDate: new Date(),
      })
      .where(eq(qualityPolicy.id, id))
      .returning();
    return result;
  }

  async updateQualityPolicy(id: string, data: Partial<InsertQualityPolicy>): Promise<QualityPolicy | undefined> {
    const [result] = await db.update(qualityPolicy).set(data).where(eq(qualityPolicy.id, id)).returning();
    return result;
  }

  // Organization Roles
  async getAllOrganizationRoles(): Promise<OrganizationRole[]> {
    return db.select().from(organizationRoles);
  }

  async getOrganizationRole(id: string): Promise<OrganizationRole | undefined> {
    const [result] = await db.select().from(organizationRoles).where(eq(organizationRoles.id, id));
    return result;
  }

  async createOrganizationRole(role: InsertOrganizationRole): Promise<OrganizationRole> {
    const [result] = await db.insert(organizationRoles).values(role).returning();
    return result;
  }

  async updateOrganizationRole(id: string, data: Partial<InsertOrganizationRole>): Promise<OrganizationRole | undefined> {
    const [result] = await db.update(organizationRoles).set(data).where(eq(organizationRoles.id, id)).returning();
    return result;
  }

  // Risks
  async getAllRisks(): Promise<Risk[]> {
    return db.select().from(risks);
  }

  async getRisk(id: string): Promise<Risk | undefined> {
    const [result] = await db.select().from(risks).where(eq(risks.id, id));
    return result;
  }

  async createRisk(risk: InsertRisk): Promise<Risk> {
    const [result] = await db.insert(risks).values(risk).returning();
    return result;
  }

  async updateRisk(id: string, data: Partial<InsertRisk>): Promise<Risk | undefined> {
    const [result] = await db.update(risks).set({ ...data, updatedAt: new Date() }).where(eq(risks.id, id)).returning();
    return result;
  }

  // Quality Objectives
  async getAllQualityObjectives(): Promise<QualityObjective[]> {
    return db.select().from(qualityObjectives);
  }

  async getQualityObjective(id: string): Promise<QualityObjective | undefined> {
    const [result] = await db.select().from(qualityObjectives).where(eq(qualityObjectives.id, id));
    return result;
  }

  async createQualityObjective(objective: InsertQualityObjective): Promise<QualityObjective> {
    const [result] = await db.insert(qualityObjectives).values(objective).returning();
    return result;
  }

  async updateQualityObjective(id: string, data: Partial<InsertQualityObjective>): Promise<QualityObjective | undefined> {
    const [result] = await db.update(qualityObjectives).set({ ...data, updatedAt: new Date() }).where(eq(qualityObjectives.id, id)).returning();
    return result;
  }

  // Change Requests
  async getAllChangeRequests(): Promise<ChangeRequest[]> {
    return db.select().from(changeRequests);
  }

  async getChangeRequest(id: string): Promise<ChangeRequest | undefined> {
    const [result] = await db.select().from(changeRequests).where(eq(changeRequests.id, id));
    return result;
  }

  async createChangeRequest(request: InsertChangeRequest): Promise<ChangeRequest> {
    const [result] = await db.insert(changeRequests).values(request).returning();
    return result;
  }

  async updateChangeRequest(id: string, data: Partial<InsertChangeRequest>): Promise<ChangeRequest | undefined> {
    const [result] = await db.update(changeRequests).set(data).where(eq(changeRequests.id, id)).returning();
    return result;
  }

  // Employees
  async getAllEmployees(): Promise<Employee[]> {
    return db.select().from(employees);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [result] = await db.select().from(employees).where(eq(employees.id, id));
    return result;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [result] = await db.insert(employees).values(employee).returning();
    return result;
  }

  async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [result] = await db.update(employees).set(data).where(eq(employees.id, id)).returning();
    return result;
  }

  // Training Records
  async getAllTrainingRecords(): Promise<TrainingRecord[]> {
    return db.select().from(trainingRecords);
  }

  async getTrainingRecord(id: string): Promise<TrainingRecord | undefined> {
    const [result] = await db.select().from(trainingRecords).where(eq(trainingRecords.id, id));
    return result;
  }

  async createTrainingRecord(record: InsertTrainingRecord): Promise<TrainingRecord> {
    const [result] = await db.insert(trainingRecords).values(record).returning();
    return result;
  }

  async updateTrainingRecord(id: string, data: Partial<InsertTrainingRecord>): Promise<TrainingRecord | undefined> {
    const [result] = await db.update(trainingRecords).set(data).where(eq(trainingRecords.id, id)).returning();
    return result;
  }

  // Documents
  async getAllDocuments(): Promise<Document[]> {
    return db.select().from(documents);
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [result] = await db.select().from(documents).where(eq(documents.id, id));
    return result;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [result] = await db.insert(documents).values(doc).returning();
    return result;
  }

  async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
    const [result] = await db.update(documents).set(data).where(eq(documents.id, id)).returning();
    return result;
  }

  async approveDocument(id: string): Promise<Document | undefined> {
    const [result] = await db
      .update(documents)
      .set({
        status: "approved",
        effectiveDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();
    return result;
  }

  // Suppliers
  async getAllSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [result] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [result] = await db.insert(suppliers).values(supplier).returning();
    return result;
  }

  async updateSupplier(id: string, data: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [result] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
    return result;
  }

  // Supplier Evaluations
  async getAllSupplierEvaluations(): Promise<SupplierEvaluation[]> {
    return db.select().from(supplierEvaluations);
  }

  async getSupplierEvaluation(id: string): Promise<SupplierEvaluation | undefined> {
    const [result] = await db.select().from(supplierEvaluations).where(eq(supplierEvaluations.id, id));
    return result;
  }

  async createSupplierEvaluation(evaluation: InsertSupplierEvaluation): Promise<SupplierEvaluation> {
    const [result] = await db.insert(supplierEvaluations).values(evaluation).returning();
    return result;
  }

  async updateSupplierEvaluation(id: string, data: Partial<InsertSupplierEvaluation>): Promise<SupplierEvaluation | undefined> {
    const [result] = await db.update(supplierEvaluations).set(data).where(eq(supplierEvaluations.id, id)).returning();
    return result;
  }

  // Audits
  async getAllAudits(): Promise<Audit[]> {
    return db.select().from(audits);
  }

  async getAudit(id: string): Promise<Audit | undefined> {
    const [result] = await db.select().from(audits).where(eq(audits.id, id));
    return result;
  }

  async createAudit(audit: InsertAudit): Promise<Audit> {
    const [result] = await db.insert(audits).values(audit).returning();
    return result;
  }

  async updateAudit(id: string, data: Partial<InsertAudit>): Promise<Audit | undefined> {
    const [result] = await db.update(audits).set(data).where(eq(audits.id, id)).returning();
    return result;
  }

  // Audit Findings
  async getAllAuditFindings(): Promise<AuditFinding[]> {
    return db.select().from(auditFindings);
  }

  async getAuditFinding(id: string): Promise<AuditFinding | undefined> {
    const [result] = await db.select().from(auditFindings).where(eq(auditFindings.id, id));
    return result;
  }

  async createAuditFinding(finding: InsertAuditFinding): Promise<AuditFinding> {
    const [result] = await db.insert(auditFindings).values(finding).returning();
    return result;
  }

  async updateAuditFinding(id: string, data: Partial<InsertAuditFinding>): Promise<AuditFinding | undefined> {
    const [result] = await db.update(auditFindings).set(data).where(eq(auditFindings.id, id)).returning();
    return result;
  }

  // Management Reviews
  async getAllManagementReviews(): Promise<ManagementReview[]> {
    return db.select().from(managementReviews);
  }

  async getManagementReview(id: string): Promise<ManagementReview | undefined> {
    const [result] = await db.select().from(managementReviews).where(eq(managementReviews.id, id));
    return result;
  }

  async createManagementReview(review: InsertManagementReview): Promise<ManagementReview> {
    const [result] = await db.insert(managementReviews).values(review).returning();
    return result;
  }

  async updateManagementReview(id: string, data: Partial<InsertManagementReview>): Promise<ManagementReview | undefined> {
    const [result] = await db.update(managementReviews).set(data).where(eq(managementReviews.id, id)).returning();
    return result;
  }

  // Corrective Actions
  async getAllCorrectiveActions(): Promise<CorrectiveAction[]> {
    return db.select().from(correctiveActions);
  }

  async getCorrectiveAction(id: string): Promise<CorrectiveAction | undefined> {
    const [result] = await db.select().from(correctiveActions).where(eq(correctiveActions.id, id));
    return result;
  }

  async createCorrectiveAction(action: InsertCorrectiveAction): Promise<CorrectiveAction> {
    const [result] = await db.insert(correctiveActions).values(action).returning();
    return result;
  }

  async updateCorrectiveAction(id: string, action: Partial<InsertCorrectiveAction>): Promise<CorrectiveAction | undefined> {
    const [result] = await db
      .update(correctiveActions)
      .set({ ...action, updatedAt: new Date() })
      .where(eq(correctiveActions.id, id))
      .returning();
    return result;
  }

  // Improvements
  async getAllImprovements(): Promise<Improvement[]> {
    return db.select().from(improvements);
  }

  async getImprovement(id: string): Promise<Improvement | undefined> {
    const [result] = await db.select().from(improvements).where(eq(improvements.id, id));
    return result;
  }

  async createImprovement(improvement: InsertImprovement): Promise<Improvement> {
    const [result] = await db.insert(improvements).values(improvement).returning();
    return result;
  }

  async updateImprovement(id: string, data: Partial<InsertImprovement>): Promise<Improvement | undefined> {
    const [result] = await db.update(improvements).set(data).where(eq(improvements.id, id)).returning();
    return result;
  }

  // KPI Metrics
  async getAllKpiMetrics(): Promise<KpiMetric[]> {
    return db.select().from(kpiMetrics);
  }

  async createKpiMetric(metric: InsertKpiMetric): Promise<KpiMetric> {
    const [result] = await db.insert(kpiMetrics).values(metric).returning();
    return result;
  }

  // QMS Scope
  async getAllQmsScopes(): Promise<QmsScope[]> {
    return db.select().from(qmsScope);
  }

  async getQmsScopeById(id: string): Promise<QmsScope | undefined> {
    const [result] = await db.select().from(qmsScope).where(eq(qmsScope.id, id));
    return result;
  }

  async createQmsScope(scope: InsertQmsScope): Promise<QmsScope> {
    const [result] = await db.insert(qmsScope).values(scope).returning();
    return result;
  }

  async updateQmsScope(id: string, scope: Partial<InsertQmsScope>): Promise<QmsScope | undefined> {
    const [result] = await db.update(qmsScope).set(scope).where(eq(qmsScope.id, id)).returning();
    return result;
  }

  // Leadership Commitments
  async getAllLeadershipCommitments(): Promise<LeadershipCommitment[]> {
    return db.select().from(leadershipCommitments);
  }

  async getLeadershipCommitment(id: string): Promise<LeadershipCommitment | undefined> {
    const [result] = await db.select().from(leadershipCommitments).where(eq(leadershipCommitments.id, id));
    return result;
  }

  async createLeadershipCommitment(commitment: InsertLeadershipCommitment): Promise<LeadershipCommitment> {
    const [result] = await db.insert(leadershipCommitments).values(commitment).returning();
    return result;
  }

  async updateLeadershipCommitment(id: string, commitment: Partial<InsertLeadershipCommitment>): Promise<LeadershipCommitment | undefined> {
    const [result] = await db.update(leadershipCommitments).set(commitment).where(eq(leadershipCommitments.id, id)).returning();
    return result;
  }

  // Resources
  async getAllResources(): Promise<Resource[]> {
    return db.select().from(resources);
  }

  async getResource(id: string): Promise<Resource | undefined> {
    const [result] = await db.select().from(resources).where(eq(resources.id, id));
    return result;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [result] = await db.insert(resources).values(resource).returning();
    return result;
  }

  async updateResource(id: string, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const [result] = await db.update(resources).set(resource).where(eq(resources.id, id)).returning();
    return result;
  }

  // Maintenance Records
  async getAllMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    return db.select().from(maintenanceRecords);
  }

  async getMaintenanceRecord(id: string): Promise<MaintenanceRecord | undefined> {
    const [result] = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id));
    return result;
  }

  async createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const [result] = await db.insert(maintenanceRecords).values(record).returning();
    return result;
  }

  async updateMaintenanceRecord(id: string, record: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord | undefined> {
    const [result] = await db.update(maintenanceRecords).set(record).where(eq(maintenanceRecords.id, id)).returning();
    return result;
  }

  // Job Descriptions
  async getAllJobDescriptions(): Promise<JobDescription[]> {
    return db.select().from(jobDescriptions);
  }

  async getJobDescription(id: string): Promise<JobDescription | undefined> {
    const [result] = await db.select().from(jobDescriptions).where(eq(jobDescriptions.id, id));
    return result;
  }

  async createJobDescription(job: InsertJobDescription): Promise<JobDescription> {
    const [result] = await db.insert(jobDescriptions).values(job).returning();
    return result;
  }

  async updateJobDescription(id: string, data: Partial<InsertJobDescription>): Promise<JobDescription | undefined> {
    const [result] = await db.update(jobDescriptions).set(data).where(eq(jobDescriptions.id, id)).returning();
    return result;
  }

  // Performance Evaluations
  async getAllPerformanceEvaluations(): Promise<PerformanceEvaluation[]> {
    return db.select().from(performanceEvaluations);
  }

  async getPerformanceEvaluation(id: string): Promise<PerformanceEvaluation | undefined> {
    const [result] = await db.select().from(performanceEvaluations).where(eq(performanceEvaluations.id, id));
    return result;
  }

  async createPerformanceEvaluation(evaluation: InsertPerformanceEvaluation): Promise<PerformanceEvaluation> {
    const [result] = await db.insert(performanceEvaluations).values(evaluation).returning();
    return result;
  }

  async updatePerformanceEvaluation(id: string, data: Partial<InsertPerformanceEvaluation>): Promise<PerformanceEvaluation | undefined> {
    const [result] = await db.update(performanceEvaluations).set(data).where(eq(performanceEvaluations.id, id)).returning();
    return result;
  }

  // Awareness Records
  async getAllAwarenessRecords(): Promise<AwarenessRecord[]> {
    return db.select().from(awarenessRecords);
  }

  async getAwarenessRecord(id: string): Promise<AwarenessRecord | undefined> {
    const [result] = await db.select().from(awarenessRecords).where(eq(awarenessRecords.id, id));
    return result;
  }

  async createAwarenessRecord(record: InsertAwarenessRecord): Promise<AwarenessRecord> {
    const [result] = await db.insert(awarenessRecords).values(record).returning();
    return result;
  }

  async updateAwarenessRecord(id: string, record: Partial<InsertAwarenessRecord>): Promise<AwarenessRecord | undefined> {
    const [result] = await db.update(awarenessRecords).set(record).where(eq(awarenessRecords.id, id)).returning();
    return result;
  }

  // Communication Records
  async getAllCommunicationRecords(): Promise<CommunicationRecord[]> {
    return db.select().from(communicationRecords);
  }

  async getCommunicationRecord(id: string): Promise<CommunicationRecord | undefined> {
    const [result] = await db.select().from(communicationRecords).where(eq(communicationRecords.id, id));
    return result;
  }

  async createCommunicationRecord(record: InsertCommunicationRecord): Promise<CommunicationRecord> {
    const [result] = await db.insert(communicationRecords).values(record).returning();
    return result;
  }

  async updateCommunicationRecord(id: string, record: Partial<InsertCommunicationRecord>): Promise<CommunicationRecord | undefined> {
    const [result] = await db.update(communicationRecords).set(record).where(eq(communicationRecords.id, id)).returning();
    return result;
  }

  // Operational Plans
  async getAllOperationalPlans(): Promise<OperationalPlan[]> {
    return db.select().from(operationalPlans);
  }

  async getOperationalPlan(id: string): Promise<OperationalPlan | undefined> {
    const [result] = await db.select().from(operationalPlans).where(eq(operationalPlans.id, id));
    return result;
  }

  async createOperationalPlan(plan: InsertOperationalPlan): Promise<OperationalPlan> {
    const [result] = await db.insert(operationalPlans).values(plan).returning();
    return result;
  }

  async updateOperationalPlan(id: string, plan: Partial<InsertOperationalPlan>): Promise<OperationalPlan | undefined> {
    const [result] = await db.update(operationalPlans).set(plan).where(eq(operationalPlans.id, id)).returning();
    return result;
  }

  // Customer Requirements
  async getAllCustomerRequirements(): Promise<CustomerRequirement[]> {
    return db.select().from(customerRequirements);
  }

  async getCustomerRequirement(id: string): Promise<CustomerRequirement | undefined> {
    const [result] = await db.select().from(customerRequirements).where(eq(customerRequirements.id, id));
    return result;
  }

  async createCustomerRequirement(requirement: InsertCustomerRequirement): Promise<CustomerRequirement> {
    const [result] = await db.insert(customerRequirements).values(requirement).returning();
    return result;
  }

  async updateCustomerRequirement(id: string, requirement: Partial<InsertCustomerRequirement>): Promise<CustomerRequirement | undefined> {
    const [result] = await db.update(customerRequirements).set(requirement).where(eq(customerRequirements.id, id)).returning();
    return result;
  }

  // Service Delivery
  async getAllServiceDelivery(): Promise<ServiceDeliveryRecord[]> {
    return db.select().from(serviceDelivery);
  }

  async getServiceDeliveryById(id: string): Promise<ServiceDeliveryRecord | undefined> {
    const [result] = await db.select().from(serviceDelivery).where(eq(serviceDelivery.id, id));
    return result;
  }

  async createServiceDelivery(delivery: InsertServiceDelivery): Promise<ServiceDeliveryRecord> {
    const [result] = await db.insert(serviceDelivery).values(delivery).returning();
    return result;
  }

  async updateServiceDelivery(id: string, delivery: Partial<InsertServiceDelivery>): Promise<ServiceDeliveryRecord | undefined> {
    const [result] = await db.update(serviceDelivery).set(delivery).where(eq(serviceDelivery.id, id)).returning();
    return result;
  }

  // Service Releases
  async getAllServiceReleases(): Promise<ServiceRelease[]> {
    return db.select().from(serviceReleases);
  }

  async getServiceRelease(id: string): Promise<ServiceRelease | undefined> {
    const [result] = await db.select().from(serviceReleases).where(eq(serviceReleases.id, id));
    return result;
  }

  async createServiceRelease(release: InsertServiceRelease): Promise<ServiceRelease> {
    const [result] = await db.insert(serviceReleases).values(release).returning();
    return result;
  }

  async updateServiceRelease(id: string, release: Partial<InsertServiceRelease>): Promise<ServiceRelease | undefined> {
    const [result] = await db.update(serviceReleases).set(release).where(eq(serviceReleases.id, id)).returning();
    return result;
  }

  // Complaints
  async getAllComplaints(): Promise<Complaint[]> {
    return db.select().from(complaints);
  }

  async getComplaint(id: string): Promise<Complaint | undefined> {
    const [result] = await db.select().from(complaints).where(eq(complaints.id, id));
    return result;
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const [result] = await db.insert(complaints).values(complaint).returning();
    return result;
  }

  async updateComplaint(id: string, complaint: Partial<InsertComplaint>): Promise<Complaint | undefined> {
    const [result] = await db.update(complaints).set(complaint).where(eq(complaints.id, id)).returning();
    return result;
  }

  // Nonconformities
  async getAllNonconformities(): Promise<Nonconformity[]> {
    return db.select().from(nonconformities);
  }

  async getNonconformity(id: string): Promise<Nonconformity | undefined> {
    const [result] = await db.select().from(nonconformities).where(eq(nonconformities.id, id));
    return result;
  }

  async createNonconformity(nc: InsertNonconformity): Promise<Nonconformity> {
    const [result] = await db.insert(nonconformities).values(nc).returning();
    return result;
  }

  async updateNonconformity(id: string, nc: Partial<InsertNonconformity>): Promise<Nonconformity | undefined> {
    const [result] = await db.update(nonconformities).set(nc).where(eq(nonconformities.id, id)).returning();
    return result;
  }

  // Improvement Framework
  async getAllImprovementFramework(): Promise<ImprovementFramework[]> {
    return db.select().from(improvementFramework);
  }

  async getImprovementFrameworkById(id: string): Promise<ImprovementFramework | undefined> {
    const [result] = await db.select().from(improvementFramework).where(eq(improvementFramework.id, id));
    return result;
  }

  async createImprovementFramework(item: InsertImprovementFramework): Promise<ImprovementFramework> {
    const [result] = await db.insert(improvementFramework).values(item).returning();
    return result;
  }

  async updateImprovementFramework(id: string, item: Partial<InsertImprovementFramework>): Promise<ImprovementFramework | undefined> {
    const [result] = await db.update(improvementFramework).set(item).where(eq(improvementFramework.id, id)).returning();
    return result;
  }

  // Personal Documents
  async getAllPersonalDocuments(): Promise<PersonalDocument[]> {
    return db.select().from(personalDocuments);
  }

  async createPersonalDocument(doc: InsertPersonalDocument): Promise<PersonalDocument> {
    const [result] = await db.insert(personalDocuments).values(doc).returning();
    return result;
  }

  async deletePersonalDocument(id: string): Promise<boolean> {
    const result = await db.delete(personalDocuments).where(eq(personalDocuments.id, id));
    return true;
  }

  // Notifications
  async getAllNotifications(): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.isRead, false)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(notification).returning();
    return result;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [result] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return result;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
  }

  // Evidence Files
  async getEvidenceFiles(module: string, entityId: string): Promise<EvidenceFile[]> {
    return db.select().from(evidenceFiles)
      .where(and(eq(evidenceFiles.module, module), eq(evidenceFiles.entityId, entityId)))
      .orderBy(desc(evidenceFiles.createdAt));
  }

  async createEvidenceFile(file: InsertEvidenceFile): Promise<EvidenceFile> {
    const [result] = await db.insert(evidenceFiles).values(file).returning();
    return result;
  }

  async deleteEvidenceFile(id: string): Promise<boolean> {
    await db.delete(evidenceFiles).where(eq(evidenceFiles.id, id));
    return true;
  }

  // Role Permissions
  async getAllRolePermissions(): Promise<RolePermission[]> {
    return db.select().from(rolePermissions);
  }

  async getRolePermissions(role: string): Promise<RolePermission[]> {
    return db.select().from(rolePermissions).where(eq(rolePermissions.role, role));
  }

  async upsertRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    const existing = await db.select().from(rolePermissions)
      .where(and(eq(rolePermissions.role, permission.role), eq(rolePermissions.submenu, permission.submenu)));
    if (existing.length > 0) {
      const [result] = await db.update(rolePermissions)
        .set({ canAccess: permission.canAccess })
        .where(eq(rolePermissions.id, existing[0].id))
        .returning();
      return result;
    }
    const [result] = await db.insert(rolePermissions).values(permission).returning();
    return result;
  }

  async updateRolePermission(id: string, canAccess: boolean): Promise<RolePermission | undefined> {
    const [result] = await db.update(rolePermissions).set({ canAccess }).where(eq(rolePermissions.id, id)).returning();
    return result;
  }

  async deleteAllRolePermissions(): Promise<void> {
    await db.delete(rolePermissions);
  }

  // Leadership KPI Data
  async getAllLeadershipKpiData(): Promise<LeadershipKpiData[]> {
    return db.select().from(leadershipKpiData).orderBy(leadershipKpiData.section);
  }

  async getLeadershipKpiDataBySection(section: string): Promise<LeadershipKpiData[]> {
    return db.select().from(leadershipKpiData).where(eq(leadershipKpiData.section, section));
  }

  async createLeadershipKpiData(data: InsertLeadershipKpiData): Promise<LeadershipKpiData> {
    const [result] = await db.insert(leadershipKpiData).values(data).returning();
    return result;
  }

  async updateLeadershipKpiData(id: string, data: Partial<InsertLeadershipKpiData>): Promise<LeadershipKpiData | undefined> {
    const [result] = await db.update(leadershipKpiData).set(data).where(eq(leadershipKpiData.id, id)).returning();
    return result;
  }

  async deleteLeadershipKpiData(id: string): Promise<boolean> {
    await db.delete(leadershipKpiData).where(eq(leadershipKpiData.id, id));
    return true;
  }

  // Performance Analysis (9.1)
  async getAllPerformanceAnalysis(): Promise<PerformanceAnalysis[]> {
    return db.select().from(performanceAnalysis).orderBy(desc(performanceAnalysis.createdAt));
  }

  async getPerformanceAnalysisById(id: string): Promise<PerformanceAnalysis | undefined> {
    const [result] = await db.select().from(performanceAnalysis).where(eq(performanceAnalysis.id, id));
    return result;
  }

  async createPerformanceAnalysis(data: InsertPerformanceAnalysis): Promise<PerformanceAnalysis> {
    const [result] = await db.insert(performanceAnalysis).values(data).returning();
    return result;
  }

  async updatePerformanceAnalysis(id: string, data: Partial<InsertPerformanceAnalysis>): Promise<PerformanceAnalysis | undefined> {
    const [result] = await db.update(performanceAnalysis).set(data).where(eq(performanceAnalysis.id, id)).returning();
    return result;
  }

  // Customer Satisfaction (9.4)
  async getAllCustomerSatisfaction(): Promise<CustomerSatisfaction[]> {
    return db.select().from(customerSatisfaction).orderBy(desc(customerSatisfaction.createdAt));
  }

  async getCustomerSatisfactionById(id: string): Promise<CustomerSatisfaction | undefined> {
    const [result] = await db.select().from(customerSatisfaction).where(eq(customerSatisfaction.id, id));
    return result;
  }

  async createCustomerSatisfaction(data: InsertCustomerSatisfaction): Promise<CustomerSatisfaction> {
    const [result] = await db.insert(customerSatisfaction).values(data).returning();
    return result;
  }

  async updateCustomerSatisfaction(id: string, data: Partial<InsertCustomerSatisfaction>): Promise<CustomerSatisfaction | undefined> {
    const [result] = await db.update(customerSatisfaction).set(data).where(eq(customerSatisfaction.id, id)).returning();
    return result;
  }

  // Innovation Initiatives (10.4)
  async getAllInnovationInitiatives(): Promise<InnovationInitiative[]> {
    return db.select().from(innovationInitiatives).orderBy(desc(innovationInitiatives.createdAt));
  }

  async getInnovationInitiative(id: string): Promise<InnovationInitiative | undefined> {
    const [result] = await db.select().from(innovationInitiatives).where(eq(innovationInitiatives.id, id));
    return result;
  }

  async createInnovationInitiative(data: InsertInnovationInitiative): Promise<InnovationInitiative> {
    const [result] = await db.insert(innovationInitiatives).values(data).returning();
    return result;
  }

  async updateInnovationInitiative(id: string, data: Partial<InsertInnovationInitiative>): Promise<InnovationInitiative | undefined> {
    const [result] = await db.update(innovationInitiatives).set(data).where(eq(innovationInitiatives.id, id)).returning();
    return result;
  }

  // Review Update & Log
  async getAllReviewUpdateLogs(): Promise<ReviewUpdateLog[]> {
    return db.select().from(reviewUpdateLog).orderBy(desc(reviewUpdateLog.createdAt));
  }

  async createReviewUpdateLog(data: InsertReviewUpdateLog): Promise<ReviewUpdateLog> {
    const [result] = await db.insert(reviewUpdateLog).values(data).returning();
    return result;
  }

  // SMTP Settings
  async getSmtpSettings(): Promise<SmtpSettings | undefined> {
    const [settings] = await db.select().from(smtpSettings).limit(1);
    return settings || undefined;
  }

  async upsertSmtpSettings(data: InsertSmtpSettings): Promise<SmtpSettings> {
    const existing = await this.getSmtpSettings();
    if (existing) {
      const [result] = await db.update(smtpSettings).set({ ...data, updatedAt: new Date() }).where(eq(smtpSettings.id, existing.id)).returning();
      return result;
    }
    const [result] = await db.insert(smtpSettings).values(data).returning();
    return result;
  }

  // Password Reset Tokens
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
  }

  async getPasswordResetToken(token: string) {
    const [result] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return result || undefined;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
