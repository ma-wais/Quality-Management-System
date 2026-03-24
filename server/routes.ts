import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { storage } from "./storage";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}
import {
  insertContextIssueSchema,
  insertInterestedPartySchema,
  insertQmsProcessSchema,
  insertQualityPolicySchema,
  insertRiskSchema,
  insertQualityObjectiveSchema,
  insertChangeRequestSchema,
  insertEmployeeSchema,
  insertTrainingRecordSchema,
  insertDocumentSchema,
  insertSupplierSchema,
  insertSupplierEvaluationSchema,
  insertAuditSchema,
  insertAuditFindingSchema,
  insertManagementReviewSchema,
  insertCorrectiveActionSchema,
  insertImprovementSchema,
  insertKpiMetricSchema,
  insertUserSchema,
  insertQmsScopeSchema,
  insertLeadershipCommitmentSchema,
  insertResourceSchema,
  insertMaintenanceRecordSchema,
  insertJobDescriptionSchema,
  insertPerformanceEvaluationSchema,
  insertAwarenessRecordSchema,
  insertCommunicationRecordSchema,
  insertOperationalPlanSchema,
  insertCustomerRequirementSchema,
  insertServiceDeliverySchema,
  insertServiceReleaseSchema,
  insertComplaintSchema,
  insertNonconformitySchema,
  insertImprovementFrameworkSchema,
  insertPersonalDocumentSchema,
  insertEvidenceFileSchema,
  insertRolePermissionSchema,
  insertLeadershipKpiDataSchema,
  insertPerformanceAnalysisSchema,
  insertCustomerSatisfactionSchema,
  insertInnovationInitiativeSchema,
  insertReviewUpdateLogSchema,
  insertOrganizationRoleSchema,
} from "@shared/schema";

const moduleNotificationMap: Record<string, { module: string; clauseRef: string; titleField: string }> = {
  "/api/context-issues": { module: "context-issues", clauseRef: "4.1", titleField: "description" },
  "/api/interested-parties": { module: "interested-parties", clauseRef: "4.2", titleField: "name" },
  "/api/qms-processes": { module: "qms-processes", clauseRef: "4.4", titleField: "processName" },
  "/api/quality-policy": { module: "quality-policy", clauseRef: "5.2", titleField: "title" },
  "/api/organization-roles": { module: "organization-roles", clauseRef: "5.3", titleField: "title" },
  "/api/risks": { module: "risks", clauseRef: "6.1", titleField: "title" },
  "/api/objectives": { module: "objectives", clauseRef: "6.2", titleField: "objectiveTitle" },
  "/api/change-requests": { module: "change-requests", clauseRef: "6.3", titleField: "changeTitle" },
  "/api/employees": { module: "employees", clauseRef: "7.2", titleField: "fullName" },
  "/api/training-records": { module: "training-records", clauseRef: "7.2", titleField: "trainingTitle" },
  "/api/documents": { module: "documents", clauseRef: "7.5", titleField: "title" },
  "/api/suppliers": { module: "suppliers", clauseRef: "8.4", titleField: "name" },
  "/api/supplier-evaluations": { module: "supplier-evaluations", clauseRef: "8.4", titleField: "supplierId" },
  "/api/audits": { module: "audits", clauseRef: "9.2", titleField: "auditNumber" },
  "/api/audit-findings": { module: "audit-findings", clauseRef: "9.2", titleField: "description" },
  "/api/management-reviews": { module: "management-reviews", clauseRef: "9.3", titleField: "reviewNumber" },
  "/api/corrective-actions": { module: "corrective-actions", clauseRef: "10.2", titleField: "title" },
  "/api/improvements": { module: "improvements", clauseRef: "10.3", titleField: "title" },
  "/api/kpi-metrics": { module: "kpi-metrics", clauseRef: "9.1", titleField: "metricName" },
  "/api/qms-scope": { module: "qms-scope", clauseRef: "4.3", titleField: "scopeStatement" },
  "/api/leadership-commitments": { module: "leadership-commitments", clauseRef: "5.1", titleField: "commitmentType" },
  "/api/resources": { module: "resources", clauseRef: "7.1", titleField: "description" },
  "/api/maintenance-records": { module: "maintenance-records", clauseRef: "7.1", titleField: "equipment" },
  "/api/job-descriptions": { module: "job-descriptions", clauseRef: "7.2", titleField: "title" },
  "/api/performance-evaluations": { module: "performance-evaluations", clauseRef: "7.2", titleField: "employeeId" },
  "/api/awareness-records": { module: "awareness-records", clauseRef: "7.3", titleField: "topic" },
  "/api/communication-records": { module: "communication-records", clauseRef: "7.4", titleField: "subject" },
  "/api/operational-plans": { module: "operational-plans", clauseRef: "8.1", titleField: "planTitle" },
  "/api/customer-requirements": { module: "customer-requirements", clauseRef: "8.2", titleField: "beneficiary" },
  "/api/service-delivery": { module: "service-delivery", clauseRef: "8.5", titleField: "service" },
  "/api/service-releases": { module: "service-releases", clauseRef: "8.6", titleField: "serviceId" },
  "/api/complaints": { module: "complaints", clauseRef: "8.7", titleField: "complaint" },
  "/api/nonconformities": { module: "nonconformities", clauseRef: "8.7", titleField: "description" },
  "/api/improvement-framework": { module: "improvement-framework", clauseRef: "10.1", titleField: "area" },
  "/api/performance-analysis": { module: "performance-analysis", clauseRef: "9.1", titleField: "indicator" },
  "/api/customer-satisfaction": { module: "customer-satisfaction", clauseRef: "9.4", titleField: "tool" },
  "/api/innovation-initiatives": { module: "innovation-initiatives", clauseRef: "10.4", titleField: "name" },
  "/api/review-update-log": { module: "review-update-log", clauseRef: "admin", titleField: "reviewNumber" },
};

async function createNotificationForPost(path: string, entity: Record<string, unknown>) {
  const mapping = moduleNotificationMap[path];
  if (!mapping) return;
  try {
    const title = (entity[mapping.titleField] as string) || mapping.module;
    await storage.createNotification({
      module: mapping.module,
      clauseRef: mapping.clauseRef,
      title,
      entityId: entity.id as string,
    });
  } catch (e) {
    console.error("Failed to create notification:", e);
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth: Seed default users
  app.post("/api/auth/seed", async (_req, res) => {
    try {
      const existingAdmin = await storage.getUserByEmail("saloua@edsa.ae");
      if (!existingAdmin) {
        const hashedPw = await bcrypt.hash("Admin@2024", 10);
        await storage.createUser({
          username: "saloua",
          password: hashedPw,
          fullName: "Saloua",
          email: "saloua@edsa.ae",
          role: "admin",
          department: "Administration",
        });
      }
      const existingQm = await storage.getUserByEmail("qm@edsa.ae");
      if (!existingQm) {
        const hashedPw = await bcrypt.hash("Qm@2024", 10);
        await storage.createUser({
          username: "quality_manager",
          password: hashedPw,
          fullName: "Quality Manager",
          email: "qm@edsa.ae",
          role: "quality_manager",
          department: "Quality",
        });
      }
      res.json({ message: "Default users seeded" });
    } catch (error) {
      res.status(500).json({ message: "Failed to seed users" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Auth: Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  // Auth: Get current user
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  // Auth: Forgot Password (request reset email)
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "If the email exists, a reset link has been sent" });
      }
      const smtpConfig = await storage.getSmtpSettings();
      if (!smtpConfig) {
        return res.status(503).json({ message: "Email service not configured. Contact your administrator." });
      }
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await storage.createPasswordResetToken(user.id, token, expiresAt);
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password,
        },
      });
      await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
        to: user.email,
        subject: "QMS Pro - Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a365d;">Password Reset Request</h2>
            <p>Hello ${user.fullName},</p>
            <p>You have requested to reset your password for QMS Pro. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #2b6cb0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${resetUrl}</p>
            <p style="color: #999; font-size: 12px;">This link will expire in 1 hour. If you did not request this reset, please ignore this email.</p>
          </div>
        `,
      });
      res.json({ message: "If the email exists, a reset link has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Auth: Reset Password (with token)
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }
      if (resetToken.used) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ message: "This reset link has expired" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      await storage.markPasswordResetTokenUsed(token);
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Protect all other API routes
  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth/")) return next();
    requireAuth(req, res, next);
  });

  // SMTP Settings (admin-only)
  app.get("/api/smtp-settings", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const settings = await storage.getSmtpSettings();
      if (!settings) {
        return res.json(null);
      }
      const { password: _, ...safeSettings } = settings;
      res.json({ ...safeSettings, password: "••••••••" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SMTP settings" });
    }
  });

  app.post("/api/smtp-settings", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { host, port, secure, username, password, fromEmail, fromName } = req.body;
      if (!host || !port || !username || !password || !fromEmail) {
        return res.status(400).json({ message: "Missing required SMTP fields" });
      }
      const settings = await storage.upsertSmtpSettings({
        host,
        port: parseInt(port),
        secure: secure || false,
        username,
        password,
        fromEmail,
        fromName: fromName || "QMS Pro",
        updatedBy: req.session.userId,
      });
      const { password: _, ...safeSettings } = settings;
      res.json({ ...safeSettings, password: "••••••••" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save SMTP settings" });
    }
  });

  app.post("/api/smtp-settings/test", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const smtpConfig = await storage.getSmtpSettings();
      if (!smtpConfig) {
        return res.status(400).json({ message: "SMTP not configured yet" });
      }
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password,
        },
      });
      await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
        to: user.email,
        subject: "QMS Pro - SMTP Test Email",
        html: `<p>This is a test email from QMS Pro. If you received this, your SMTP settings are configured correctly.</p>`,
      });
      res.json({ message: "Test email sent successfully" });
    } catch (error: any) {
      res.status(500).json({ message: `SMTP test failed: ${error.message}` });
    }
  });

  // Users
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({ ...data, password: hashedPassword });
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updateSchema = insertUserSchema.partial();
      const data = updateSchema.parse(req.body);
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }
      const user = await storage.updateUser(req.params.id, data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Context Issues (4.1)
  app.get("/api/context-issues", async (_req, res) => {
    try {
      const issues = await storage.getAllContextIssues();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch context issues" });
    }
  });

  app.post("/api/context-issues", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create issues" });
      const data = insertContextIssueSchema.parse(req.body);
      const issueData = {
        ...data,
        createdBy: req.session.userId,
        createdByName: user.fullName || "Unknown",
      };
      const issue = await storage.createContextIssue(issueData);
      await createNotificationForPost("/api/context-issues", issue as unknown as Record<string, unknown>);
      res.status(201).json(issue);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/context-issues/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });

      const existingIssue = await storage.getContextIssue(req.params.id);
      if (!existingIssue) return res.status(404).json({ message: "Issue not found" });

      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") {
          return res.status(403).json({ message: "Only admin and upper management can review issues" });
        }
      } else {
        if (existingIssue.createdBy !== user.id) {
          return res.status(403).json({ message: "Only the creator can edit this issue" });
        }
        if (existingIssue.reviewCompletedAt) {
          return res.status(403).json({ message: "Cannot edit a reviewed issue" });
        }
      }

      const updateSchema = insertContextIssueSchema.partial().extend({
        reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
      });
      const data = updateSchema.parse(req.body);
      const issue = await storage.updateContextIssue(req.params.id, data);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.json(issue);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Interested Parties (4.2)
  app.get("/api/interested-parties", async (_req, res) => {
    try {
      const parties = await storage.getAllInterestedParties();
      res.json(parties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interested parties" });
    }
  });

  app.post("/api/interested-parties", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertInterestedPartySchema.parse(req.body);
      const party = await storage.createInterestedParty({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/interested-parties", party as unknown as Record<string, unknown>);
      res.status(201).json(party);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/interested-parties/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getInterestedParty(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertInterestedPartySchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateInterestedParty(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // QMS Processes (4.4)
  app.get("/api/qms-processes", async (_req, res) => {
    try {
      const processes = await storage.getAllQmsProcesses();
      res.json(processes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch QMS processes" });
    }
  });

  app.post("/api/qms-processes", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertQmsProcessSchema.parse(req.body);
      const process = await storage.createQmsProcess({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/qms-processes", process as unknown as Record<string, unknown>);
      res.status(201).json(process);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/qms-processes/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getQmsProcess(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertQmsProcessSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateQmsProcess(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Quality Policy (5.2)
  app.get("/api/quality-policy", async (_req, res) => {
    try {
      const policies = await storage.getAllQualityPolicies();
      res.json(policies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quality policies" });
    }
  });

  app.post("/api/quality-policy", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertQualityPolicySchema.parse(req.body);
      const policy = await storage.createQualityPolicy({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/quality-policy", policy as unknown as Record<string, unknown>);
      res.status(201).json(policy);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/quality-policy/:id/approve", async (req, res) => {
    try {
      const policy = await storage.approveQualityPolicy(req.params.id);
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }
      res.json(policy);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve policy" });
    }
  });

  app.patch("/api/quality-policy/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getQualityPolicyById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertQualityPolicySchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateQualityPolicy(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Organization Roles (5.3)
  app.get("/api/organization-roles", async (_req, res) => {
    try {
      const roles = await storage.getAllOrganizationRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization roles" });
    }
  });

  app.post("/api/organization-roles", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertOrganizationRoleSchema.parse(req.body);
      const role = await storage.createOrganizationRole({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/organization-roles", role as unknown as Record<string, unknown>);
      res.status(201).json(role);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/organization-roles/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getOrganizationRole(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertOrganizationRoleSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateOrganizationRole(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Risks (6.1)
  app.get("/api/risks", async (_req, res) => {
    try {
      const riskList = await storage.getAllRisks();
      res.json(riskList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch risks" });
    }
  });

  app.post("/api/risks", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertRiskSchema.parse(req.body);
      const risk = await storage.createRisk({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/risks", risk as unknown as Record<string, unknown>);
      res.status(201).json(risk);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/risks/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getRisk(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertRiskSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateRisk(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Quality Objectives (6.2)
  app.get("/api/objectives", async (_req, res) => {
    try {
      const objectives = await storage.getAllQualityObjectives();
      res.json(objectives);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch objectives" });
    }
  });

  app.post("/api/objectives", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertQualityObjectiveSchema.parse(req.body);
      const objective = await storage.createQualityObjective({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/objectives", objective as unknown as Record<string, unknown>);
      res.status(201).json(objective);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/objectives/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getQualityObjective(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertQualityObjectiveSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateQualityObjective(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Change Requests (6.3)
  app.get("/api/change-requests", async (_req, res) => {
    try {
      const requests = await storage.getAllChangeRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch change requests" });
    }
  });

  app.post("/api/change-requests", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertChangeRequestSchema.parse(req.body);
      const request = await storage.createChangeRequest({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/change-requests", request as unknown as Record<string, unknown>);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/change-requests/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getChangeRequest(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertChangeRequestSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateChangeRequest(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Employees (7.2)
  app.get("/api/employees", async (_req, res) => {
    try {
      const employeeList = await storage.getAllEmployees();
      res.json(employeeList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/employees", employee as unknown as Record<string, unknown>);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getEmployee(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertEmployeeSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateEmployee(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Training Records (7.2)
  app.get("/api/training-records", async (_req, res) => {
    try {
      const records = await storage.getAllTrainingRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch training records" });
    }
  });

  app.post("/api/training-records", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertTrainingRecordSchema.parse(req.body);
      const record = await storage.createTrainingRecord({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/training-records", record as unknown as Record<string, unknown>);
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/training-records/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getTrainingRecord(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertTrainingRecordSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateTrainingRecord(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Documents (7.5)
  app.get("/api/documents", async (_req, res) => {
    try {
      const docs = await storage.getAllDocuments();
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertDocumentSchema.parse(req.body);
      const doc = await storage.createDocument({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/documents", doc as unknown as Record<string, unknown>);
      res.status(201).json(doc);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/documents/:id/approve", async (req, res) => {
    try {
      const doc = await storage.approveDocument(req.params.id);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(doc);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve document" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getDocument(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertDocumentSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateDocument(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Suppliers (8.4)
  app.get("/api/suppliers", async (_req, res) => {
    try {
      const supplierList = await storage.getAllSuppliers();
      res.json(supplierList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/suppliers", supplier as unknown as Record<string, unknown>);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getSupplier(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertSupplierSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateSupplier(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Supplier Evaluations (8.4)
  app.get("/api/supplier-evaluations", async (_req, res) => {
    try {
      const evaluations = await storage.getAllSupplierEvaluations();
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch evaluations" });
    }
  });

  app.post("/api/supplier-evaluations", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertSupplierEvaluationSchema.parse(req.body);
      const evaluation = await storage.createSupplierEvaluation({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/supplier-evaluations", evaluation as unknown as Record<string, unknown>);
      res.status(201).json(evaluation);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/supplier-evaluations/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getSupplierEvaluation(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertSupplierEvaluationSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateSupplierEvaluation(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Audits (9.2)
  app.get("/api/audits", async (_req, res) => {
    try {
      const auditList = await storage.getAllAudits();
      res.json(auditList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audits" });
    }
  });

  app.post("/api/audits", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertAuditSchema.parse(req.body);
      const audit = await storage.createAudit({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/audits", audit as unknown as Record<string, unknown>);
      res.status(201).json(audit);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/audits/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getAudit(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertAuditSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateAudit(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Audit Findings (9.2)
  app.get("/api/audit-findings", async (_req, res) => {
    try {
      const findings = await storage.getAllAuditFindings();
      res.json(findings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch findings" });
    }
  });

  app.post("/api/audit-findings", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertAuditFindingSchema.parse(req.body);
      const finding = await storage.createAuditFinding({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/audit-findings", finding as unknown as Record<string, unknown>);
      res.status(201).json(finding);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/audit-findings/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getAuditFinding(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertAuditFindingSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateAuditFinding(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Management Reviews (9.3)
  app.get("/api/management-reviews", async (_req, res) => {
    try {
      const reviews = await storage.getAllManagementReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/management-reviews", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertManagementReviewSchema.parse(req.body);
      const review = await storage.createManagementReview({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/management-reviews", review as unknown as Record<string, unknown>);
      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/management-reviews/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getManagementReview(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertManagementReviewSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateManagementReview(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Performance Analysis (9.1)
  app.get("/api/performance-analysis", async (_req, res) => {
    try {
      const data = await storage.getAllPerformanceAnalysis();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance analysis" });
    }
  });

  app.post("/api/performance-analysis", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertPerformanceAnalysisSchema.parse(req.body);
      const result = await storage.createPerformanceAnalysis({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/performance-analysis", result as unknown as Record<string, unknown>);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/performance-analysis/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getPerformanceAnalysisById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription2 !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const body = { ...req.body };
      if (body.reviewDate && typeof body.reviewDate === "string") body.reviewDate = new Date(body.reviewDate);
      const updateSchema = insertPerformanceAnalysisSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(body);
      const result = await storage.updatePerformanceAnalysis(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Customer Satisfaction (9.4)
  app.get("/api/customer-satisfaction", async (_req, res) => {
    try {
      const data = await storage.getAllCustomerSatisfaction();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer satisfaction" });
    }
  });

  app.post("/api/customer-satisfaction", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertCustomerSatisfactionSchema.parse(req.body);
      const result = await storage.createCustomerSatisfaction({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/customer-satisfaction", result as unknown as Record<string, unknown>);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/customer-satisfaction/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getCustomerSatisfactionById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription2 !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const body = { ...req.body };
      if (body.reviewDate && typeof body.reviewDate === "string") body.reviewDate = new Date(body.reviewDate);
      const updateSchema = insertCustomerSatisfactionSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(body);
      const result = await storage.updateCustomerSatisfaction(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Corrective Actions (10.2)
  app.get("/api/corrective-actions", async (_req, res) => {
    try {
      const actions = await storage.getAllCorrectiveActions();
      res.json(actions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch corrective actions" });
    }
  });

  app.post("/api/corrective-actions", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertCorrectiveActionSchema.parse(req.body);
      const action = await storage.createCorrectiveAction({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/corrective-actions", action as unknown as Record<string, unknown>);
      res.status(201).json(action);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/corrective-actions/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getCorrectiveAction(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertCorrectiveActionSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateCorrectiveAction(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Improvements (10.3)
  app.get("/api/improvements", async (_req, res) => {
    try {
      const improvementList = await storage.getAllImprovements();
      res.json(improvementList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch improvements" });
    }
  });

  app.post("/api/improvements", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertImprovementSchema.parse(req.body);
      const improvement = await storage.createImprovement({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/improvements", improvement as unknown as Record<string, unknown>);
      res.status(201).json(improvement);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/improvements/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getImprovement(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertImprovementSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateImprovement(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // KPI Metrics
  app.get("/api/kpi-metrics", async (_req, res) => {
    try {
      const metrics = await storage.getAllKpiMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch KPI metrics" });
    }
  });

  app.post("/api/kpi-metrics", async (req, res) => {
    try {
      const data = insertKpiMetricSchema.parse(req.body);
      const metric = await storage.createKpiMetric(data);
      await createNotificationForPost("/api/kpi-metrics", metric as unknown as Record<string, unknown>);
      res.status(201).json(metric);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // QMS Scope (4.3)
  app.get("/api/qms-scope", async (_req, res) => {
    try {
      const scopes = await storage.getAllQmsScopes();
      res.json(scopes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch QMS scope" });
    }
  });

  app.post("/api/qms-scope", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertQmsScopeSchema.parse(req.body);
      const scope = await storage.createQmsScope({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/qms-scope", scope as unknown as Record<string, unknown>);
      res.status(201).json(scope);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/qms-scope/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getQmsScopeById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertQmsScopeSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateQmsScope(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Leadership Commitments (5.1)
  app.get("/api/leadership-commitments", async (_req, res) => {
    try {
      const commitments = await storage.getAllLeadershipCommitments();
      res.json(commitments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leadership commitments" });
    }
  });

  app.post("/api/leadership-commitments", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertLeadershipCommitmentSchema.parse(req.body);
      const commitment = await storage.createLeadershipCommitment({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/leadership-commitments", commitment as unknown as Record<string, unknown>);
      res.status(201).json(commitment);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/leadership-commitments/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getLeadershipCommitment(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertLeadershipCommitmentSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateLeadershipCommitment(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Resources (7.1)
  app.get("/api/resources", async (_req, res) => {
    try {
      const resourceList = await storage.getAllResources();
      res.json(resourceList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/resources", resource as unknown as Record<string, unknown>);
      res.status(201).json(resource);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/resources/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getResource(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertResourceSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateResource(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Maintenance Records (7.1)
  app.get("/api/maintenance-records", async (_req, res) => {
    try {
      const records = await storage.getAllMaintenanceRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch maintenance records" });
    }
  });

  app.post("/api/maintenance-records", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertMaintenanceRecordSchema.parse(req.body);
      const record = await storage.createMaintenanceRecord({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/maintenance-records", record as unknown as Record<string, unknown>);
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/maintenance-records/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getMaintenanceRecord(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertMaintenanceRecordSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateMaintenanceRecord(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Job Descriptions (7.2)
  app.get("/api/job-descriptions", async (_req, res) => {
    try {
      const jobs = await storage.getAllJobDescriptions();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job descriptions" });
    }
  });

  app.post("/api/job-descriptions", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const body = { ...req.body };
      if (body.approvalDate && typeof body.approvalDate === "string") body.approvalDate = new Date(body.approvalDate);
      const data = insertJobDescriptionSchema.parse(body);
      const job = await storage.createJobDescription({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/job-descriptions", job as unknown as Record<string, unknown>);
      res.status(201).json(job);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/job-descriptions/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getJobDescription(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertJobDescriptionSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateJobDescription(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Performance Evaluations (7.2)
  app.get("/api/performance-evaluations", async (_req, res) => {
    try {
      const evaluations = await storage.getAllPerformanceEvaluations();
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance evaluations" });
    }
  });

  app.post("/api/performance-evaluations", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertPerformanceEvaluationSchema.parse(req.body);
      const evaluation = await storage.createPerformanceEvaluation({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/performance-evaluations", evaluation as unknown as Record<string, unknown>);
      res.status(201).json(evaluation);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/performance-evaluations/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getPerformanceEvaluation(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertPerformanceEvaluationSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updatePerformanceEvaluation(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Awareness Records (7.3)
  app.get("/api/awareness-records", async (_req, res) => {
    try {
      const records = await storage.getAllAwarenessRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch awareness records" });
    }
  });

  app.post("/api/awareness-records", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertAwarenessRecordSchema.parse(req.body);
      const record = await storage.createAwarenessRecord({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/awareness-records", record as unknown as Record<string, unknown>);
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/awareness-records/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getAwarenessRecord(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertAwarenessRecordSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateAwarenessRecord(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Communication Records (7.4)
  app.get("/api/communication-records", async (_req, res) => {
    try {
      const records = await storage.getAllCommunicationRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communication records" });
    }
  });

  app.post("/api/communication-records", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertCommunicationRecordSchema.parse(req.body);
      const record = await storage.createCommunicationRecord({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/communication-records", record as unknown as Record<string, unknown>);
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/communication-records/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getCommunicationRecord(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertCommunicationRecordSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateCommunicationRecord(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Operational Plans (8.1)
  app.get("/api/operational-plans", async (_req, res) => {
    try {
      const plans = await storage.getAllOperationalPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operational plans" });
    }
  });

  app.post("/api/operational-plans", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertOperationalPlanSchema.parse(req.body);
      const plan = await storage.createOperationalPlan({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/operational-plans", plan as unknown as Record<string, unknown>);
      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/operational-plans/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getOperationalPlan(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertOperationalPlanSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateOperationalPlan(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Customer Requirements (8.2)
  app.get("/api/customer-requirements", async (_req, res) => {
    try {
      const requirements = await storage.getAllCustomerRequirements();
      res.json(requirements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer requirements" });
    }
  });

  app.post("/api/customer-requirements", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertCustomerRequirementSchema.parse(req.body);
      const requirement = await storage.createCustomerRequirement({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/customer-requirements", requirement as unknown as Record<string, unknown>);
      res.status(201).json(requirement);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/customer-requirements/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getCustomerRequirement(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertCustomerRequirementSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateCustomerRequirement(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Service Delivery (8.5)
  app.get("/api/service-delivery", async (_req, res) => {
    try {
      const deliveries = await storage.getAllServiceDelivery();
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service delivery records" });
    }
  });

  app.post("/api/service-delivery", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertServiceDeliverySchema.parse(req.body);
      const delivery = await storage.createServiceDelivery({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/service-delivery", delivery as unknown as Record<string, unknown>);
      res.status(201).json(delivery);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/service-delivery/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getServiceDeliveryById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertServiceDeliverySchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateServiceDelivery(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Service Releases (8.6)
  app.get("/api/service-releases", async (_req, res) => {
    try {
      const releases = await storage.getAllServiceReleases();
      res.json(releases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service releases" });
    }
  });

  app.post("/api/service-releases", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertServiceReleaseSchema.parse(req.body);
      const release = await storage.createServiceRelease({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/service-releases", release as unknown as Record<string, unknown>);
      res.status(201).json(release);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/service-releases/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getServiceRelease(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertServiceReleaseSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateServiceRelease(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Complaints (8.7)
  app.get("/api/complaints", async (_req, res) => {
    try {
      const complaintList = await storage.getAllComplaints();
      res.json(complaintList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch complaints" });
    }
  });

  app.post("/api/complaints", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertComplaintSchema.parse(req.body);
      const complaint = await storage.createComplaint({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/complaints", complaint as unknown as Record<string, unknown>);
      res.status(201).json(complaint);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/complaints/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getComplaint(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertComplaintSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateComplaint(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Nonconformities (8.7)
  app.get("/api/nonconformities", async (_req, res) => {
    try {
      const ncList = await storage.getAllNonconformities();
      res.json(ncList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nonconformities" });
    }
  });

  app.post("/api/nonconformities", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertNonconformitySchema.parse(req.body);
      const nc = await storage.createNonconformity({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/nonconformities", nc as unknown as Record<string, unknown>);
      res.status(201).json(nc);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/nonconformities/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getNonconformity(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertNonconformitySchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateNonconformity(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Improvement Framework (10.1)
  app.get("/api/improvement-framework", async (_req, res) => {
    try {
      const items = await storage.getAllImprovementFramework();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch improvement framework" });
    }
  });

  app.post("/api/improvement-framework", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const data = insertImprovementFrameworkSchema.parse(req.body);
      const item = await storage.createImprovementFramework({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/improvement-framework", item as unknown as Record<string, unknown>);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/improvement-framework/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getImprovementFrameworkById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const updateSchema = insertImprovementFrameworkSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(req.body);
      const result = await storage.updateImprovementFramework(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const unreadOnly = req.query.unread === "true";
      const notificationList = unreadOnly
        ? await storage.getUnreadNotifications()
        : await storage.getAllNotifications();
      res.json(notificationList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/read-all", async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead();
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Evidence Files
  app.get("/api/evidence-files/:module/:entityId", async (req, res) => {
    try {
      const files = await storage.getEvidenceFiles(req.params.module, req.params.entityId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch evidence files" });
    }
  });

  app.post("/api/evidence-files", async (req, res) => {
    try {
      const data = insertEvidenceFileSchema.parse(req.body);
      const file = await storage.createEvidenceFile(data);
      res.status(201).json(file);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/evidence-files/:id", async (req, res) => {
    try {
      await storage.deleteEvidenceFile(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete evidence file" });
    }
  });

  // Innovation Initiatives (10.4)
  app.get("/api/innovation-initiatives", async (_req, res) => {
    try {
      const data = await storage.getAllInnovationInitiatives();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch innovation initiatives" });
    }
  });

  app.post("/api/innovation-initiatives", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      if (user.role === "auditor") return res.status(403).json({ message: "Auditors cannot create records" });
      const body = { ...req.body };
      if (body.date && typeof body.date === "string") body.date = new Date(body.date);
      const data = insertInnovationInitiativeSchema.parse(body);
      const result = await storage.createInnovationInitiative({ ...data, createdBy: req.session.userId, createdByName: user.fullName || "Unknown" });
      await createNotificationForPost("/api/innovation-initiatives", result as unknown as Record<string, unknown>);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/innovation-initiatives/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getInnovationInitiative(req.params.id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const isReviewUpdate = req.body.reviewDescription !== undefined || req.body.reviewCompletedAt !== undefined;
      if (isReviewUpdate) {
        if (user.role !== "admin" && user.role !== "upper_management") return res.status(403).json({ message: "Only admin and upper management can review" });
      } else {
        if (existing.createdBy !== user.id) return res.status(403).json({ message: "Only the creator can edit" });
        if (existing.reviewCompletedAt) return res.status(403).json({ message: "Cannot edit a reviewed record" });
      }
      const body = { ...req.body };
      if (body.date && typeof body.date === "string") body.date = new Date(body.date);
      const updateSchema = insertInnovationInitiativeSchema.partial().extend({ reviewCompletedAt: z.string().optional().transform(val => val ? new Date(val) : undefined) });
      const data = updateSchema.parse(body);
      const result = await storage.updateInnovationInitiative(req.params.id, data);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Review Update & Log
  app.get("/api/review-update-log", async (_req, res) => {
    try {
      const data = await storage.getAllReviewUpdateLogs();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch review update logs" });
    }
  });

  app.post("/api/review-update-log", async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.date && typeof body.date === "string") {
        body.date = new Date(body.date);
      }
      const data = insertReviewUpdateLogSchema.parse(body);
      const result = await storage.createReviewUpdateLog(data);
      await createNotificationForPost("/api/review-update-log", result as unknown as Record<string, unknown>);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Role Permissions
  app.get("/api/role-permissions", async (_req, res) => {
    try {
      const permissions = await storage.getAllRolePermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.get("/api/role-permissions/:role", async (req, res) => {
    try {
      const permissions = await storage.getRolePermissions(req.params.role);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.post("/api/role-permissions", async (req, res) => {
    try {
      const data = insertRolePermissionSchema.parse(req.body);
      const permission = await storage.upsertRolePermission(data);
      res.status(201).json(permission);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/role-permissions/:id", async (req, res) => {
    try {
      const { canAccess } = req.body;
      if (typeof canAccess !== "boolean") {
        return res.status(400).json({ message: "canAccess must be a boolean" });
      }
      const result = await storage.updateRolePermission(req.params.id, canAccess);
      if (!result) {
        return res.status(404).json({ message: "Permission not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.post("/api/role-permissions/seed", async (_req, res) => {
    try {
      const submenus = [
        "context/issues", "context/parties", "context/scope", "context/processes", "context/kpis",
        "leadership/commitment", "leadership/policy", "leadership/roles", "leadership/kpis",
        "planning/risks", "planning/objectives", "planning/changes", "planning/kpis",
        "support/resources", "support/competence", "support/documents", "support/kpis",
        "operation/planning", "operation/requirements", "operation/suppliers", "operation/delivery", "operation/release", "operation/nonconforming", "operation/kpis",
        "performance/analysis", "performance/audits", "performance/reviews", "performance/satisfaction", "performance/section-kpis",
        "improvement/framework", "improvement/car", "improvement/ideas", "improvement/innovation", "improvement/kpis",
        "admin/users", "admin/documents", "admin/review-log",
      ];
      const roles = ["admin", "quality_manager", "auditor", "upper_management", "user"];
      const restrictedForAuditor = ["admin/users", "leadership/roles", "admin/review-log"];
      const restrictedForUpperMgmt = ["admin/users", "leadership/roles"];
      const restrictedForUser = ["admin/users", "leadership/roles", "improvement/car", "admin/review-log"];

      await storage.deleteAllRolePermissions();
      for (const role of roles) {
        for (const submenu of submenus) {
          let canAccess = true;
          if (role === "auditor" && restrictedForAuditor.includes(submenu)) canAccess = false;
          if (role === "upper_management" && restrictedForUpperMgmt.includes(submenu)) canAccess = false;
          if (role === "user" && restrictedForUser.includes(submenu)) canAccess = false;
          await storage.upsertRolePermission({ role, submenu, canAccess });
        }
      }
      const permissions = await storage.getAllRolePermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to seed role permissions" });
    }
  });

  // Leadership KPI Data
  app.get("/api/leadership-kpi-data", async (_req, res) => {
    try {
      const data = await storage.getAllLeadershipKpiData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leadership KPI data" });
    }
  });

  app.get("/api/leadership-kpi-data/:section", async (req, res) => {
    try {
      const data = await storage.getLeadershipKpiDataBySection(req.params.section);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leadership KPI data" });
    }
  });

  app.post("/api/leadership-kpi-data", async (req, res) => {
    try {
      const data = insertLeadershipKpiDataSchema.parse(req.body);
      const result = await storage.createLeadershipKpiData(data);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.patch("/api/leadership-kpi-data/:id", async (req, res) => {
    try {
      const updateSchema = insertLeadershipKpiDataSchema.partial();
      const data = updateSchema.parse(req.body);
      const result = await storage.updateLeadershipKpiData(req.params.id, data);
      if (!result) {
        return res.status(404).json({ message: "KPI data not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/leadership-kpi-data/:id", async (req, res) => {
    try {
      await storage.deleteLeadershipKpiData(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete KPI data" });
    }
  });

  app.post("/api/leadership-kpi-data/seed", async (_req, res) => {
    try {
      const existing = await storage.getAllLeadershipKpiData();
      if (existing.length > 0) {
        return res.json(existing);
      }
      const seedData = [
        { section: "5.1", indicator: "Management commitment to implementing quality reviews", measurementMethod: "Number of meetings held", target: "4 times/year", actualValue: "", period: "" },
        { section: "5.1", indicator: "Achieving quality goals", measurementMethod: "Completion rate", target: "≥ 90%", actualValue: "", period: "" },
        { section: "5.1", indicator: "Employee awareness of quality policies", measurementMethod: "Survey results", target: "≥ 85%", actualValue: "", period: "" },
        { section: "5.3", indicator: "Completion of operations documentation", measurementMethod: "Percentage of documented operations", target: "100%", actualValue: "", period: "" },
        { section: "5.3", indicator: "Operations efficiency", measurementMethod: "Performance indicators results", target: "≥ 90%", actualValue: "", period: "" },
        { section: "5.3", indicator: "Implementation of improvement plans", measurementMethod: "Percentage of implemented actions", target: "≥ 95%", actualValue: "", period: "" },
      ];
      const results = [];
      for (const item of seedData) {
        const result = await storage.createLeadershipKpiData(item);
        results.push(result);
      }
      res.status(201).json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to seed leadership KPI data" });
    }
  });

  app.post("/api/leadership-kpi-data/seed-context", async (_req, res) => {
    try {
      const existing = await storage.getAllLeadershipKpiData();
      const contextExists = existing.some(d => d.section.startsWith("4."));
      if (contextExists) {
        return res.json(existing.filter(d => d.section.startsWith("4.")));
      }
      const seedData = [
        { section: "4.1", indicator: "Completion of issues analysis update", measurementMethod: "Number of reviews completed annually", target: "At least once per year", actualValue: "", period: "" },
        { section: "4.1", indicator: "Relevance of issues to strategic objectives", measurementMethod: "Percentage of issues directly linked to objectives", target: "≥ 90%", actualValue: "", period: "" },
        { section: "4.1", indicator: "Speed of register update upon change", measurementMethod: "Time taken for update", target: "≤ 30 days", actualValue: "", period: "" },
        { section: "4.2", indicator: "Completeness of interested parties register", measurementMethod: "Completion percentage", target: "100%", actualValue: "", period: "" },
        { section: "4.2", indicator: "Requirements update", measurementMethod: "Number of annual reviews", target: "At least once per year", actualValue: "", period: "" },
        { section: "4.2", indicator: "Satisfaction level of interested parties", measurementMethod: "Survey results", target: "≥ 85%", actualValue: "", period: "" },
        { section: "4.3", indicator: "Clarity and approval of scope", measurementMethod: "Existence of an approved document", target: "100%", actualValue: "", period: "" },
        { section: "4.3", indicator: "Scope update upon change", measurementMethod: "Number of completed updates", target: "Within 30 days of any change", actualValue: "", period: "" },
        { section: "4.3", indicator: "Departments' adherence to scope", measurementMethod: "Internal audit results", target: "≥ 95%", actualValue: "", period: "" },
        { section: "4.4", indicator: "Completeness of process documentation", measurementMethod: "Percentage of documented processes", target: "100%", actualValue: "", period: "" },
        { section: "4.4", indicator: "Process efficiency", measurementMethod: "Performance indicator results", target: "≥ 90%", actualValue: "", period: "" },
        { section: "4.4", indicator: "Implementation of improvement plans", measurementMethod: "Percentage of actions completed", target: "≥ 95%", actualValue: "", period: "" },
      ];
      const results = [];
      for (const item of seedData) {
        const result = await storage.createLeadershipKpiData(item);
        results.push(result);
      }
      res.status(201).json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to seed context KPI data" });
    }
  });

  app.post("/api/leadership-kpi-data/seed-section", async (req, res) => {
    try {
      const { prefix } = req.body;
      if (!prefix || !["6", "7", "8", "9", "10"].includes(prefix)) {
        return res.status(400).json({ message: "Invalid section prefix" });
      }
      const existing = await storage.getAllLeadershipKpiData();
      const sectionExists = existing.some(d => d.section.startsWith(`${prefix}.`));
      if (sectionExists) {
        return res.json(existing.filter(d => d.section.startsWith(`${prefix}.`)));
      }

      const seedMap: Record<string, Array<{ section: string; indicator: string; measurementMethod: string; target: string }>> = {
        "6": [
          { section: "6.1", indicator: "Risk register update", measurementMethod: "Number of annual reviews", target: "At least 2 times" },
          { section: "6.1", indicator: "Implementation of treatment plans", measurementMethod: "Completion percentage", target: "≥ 90%" },
          { section: "6.1", indicator: "Reduction in operational incidents", measurementMethod: "Number of recorded cases", target: "Continuous annual decline" },
          { section: "6.2", indicator: "Rate of achieving quality objectives", measurementMethod: "Annual assessment results", target: "≥ 90%" },
          { section: "6.2", indicator: "Adherence to timelines", measurementMethod: "Completion percentage", target: "≥ 95%" },
          { section: "6.2", indicator: "Improvement in overall performance indicators", measurementMethod: "Annual comparison", target: "Continuous improvement" },
          { section: "6.3", indicator: "Documentation of all changes", measurementMethod: "Percentage of documented requests", target: "100%" },
          { section: "6.3", indicator: "Successful change implementation", measurementMethod: "Percentage of successful changes", target: "≥ 90%" },
          { section: "6.3", indicator: "Reduction of negative impacts", measurementMethod: "Number of resulting problems", target: "Continuous decline" },
        ],
        "7": [
          { section: "7.1", indicator: "Completeness of job descriptions", measurementMethod: "Coverage percentage", target: "100%" },
          { section: "7.1", indicator: "Training plan implementation", measurementMethod: "Completion percentage", target: "≥ 90%" },
          { section: "7.1", indicator: "Employee performance improvement", measurementMethod: "Assessment results", target: "Continuous annual improvement" },
          { section: "7.2", indicator: "Facility readiness", measurementMethod: "Periodic inspection results", target: "≥ 95%" },
          { section: "7.2", indicator: "Reduction in incidents", measurementMethod: "Number of recorded incidents", target: "Zero major incidents" },
          { section: "7.2", indicator: "Employee satisfaction", measurementMethod: "Survey results", target: "≥ 85%" },
          { section: "7.3", indicator: "Completeness of knowledge documentation", measurementMethod: "Percentage of approved documents", target: "100%" },
          { section: "7.3", indicator: "Document updates", measurementMethod: "Number of annual reviews", target: "At least 2 times" },
          { section: "7.3", indicator: "Ease of information access", measurementMethod: "User survey results", target: "≥ 90%" },
          { section: "7.4", indicator: "Completeness of document approval", measurementMethod: "Percentage of approved documents", target: "100%" },
          { section: "7.4", indicator: "Adherence to approved versions", measurementMethod: "Audit results", target: "Zero non-conformance cases" },
          { section: "7.4", indicator: "Speed of record retrieval", measurementMethod: "Average retrieval time", target: "≤ 5 minutes" },
        ],
        "8": [
          { section: "8.1", indicator: "Adherence to operational plans", measurementMethod: "Completion percentage", target: "≥ 95%" },
          { section: "8.1", indicator: "Beneficiary satisfaction", measurementMethod: "Survey results", target: "≥ 90%" },
          { section: "8.1", indicator: "Quality of services provided", measurementMethod: "Assessment results", target: "Continuous improvement" },
          { section: "8.2", indicator: "Clarity of service requirements", measurementMethod: "Percentage of documented requirements", target: "100%" },
          { section: "8.2", indicator: "Beneficiary satisfaction", measurementMethod: "Survey results", target: "≥ 90%" },
          { section: "8.2", indicator: "Response speed to requests", measurementMethod: "Average processing time", target: "≤ 3 days" },
          { section: "8.3", indicator: "Adherence to development schedule", measurementMethod: "Completion percentage", target: "≥ 95%" },
          { section: "8.3", indicator: "Success of new service launches", measurementMethod: "Assessment results", target: "≥ 90%" },
          { section: "8.3", indicator: "Beneficiary satisfaction", measurementMethod: "Survey results", target: "≥ 90%" },
          { section: "8.4", indicator: "Percentage of approved suppliers", measurementMethod: "Number of qualified suppliers", target: "100%" },
          { section: "8.4", indicator: "Quality of products and services", measurementMethod: "Assessment results", target: "≥ 90%" },
          { section: "8.4", indicator: "Delivery schedule adherence", measurementMethod: "Adherence percentage", target: "≥ 95%" },
          { section: "8.5", indicator: "Adherence to planned programs", measurementMethod: "Completion percentage", target: "≥ 95%" },
          { section: "8.5", indicator: "Beneficiary satisfaction", measurementMethod: "Survey results", target: "≥ 90%" },
          { section: "8.5", indicator: "Service quality", measurementMethod: "Assessment reports", target: "Continuous improvement" },
          { section: "8.6", indicator: "Asset register accuracy", measurementMethod: "Match percentage", target: "100%" },
          { section: "8.6", indicator: "Reduction in damage cases", measurementMethod: "Number of cases", target: "Continuous annual decline" },
          { section: "8.6", indicator: "Adherence to protection procedures", measurementMethod: "Inspection results", target: "≥ 95%" },
          { section: "8.7", indicator: "Number of non-conformance cases", measurementMethod: "Periodic register", target: "Continuous decline" },
          { section: "8.7", indicator: "Speed of case treatment", measurementMethod: "Average closure time", target: "≤ 3 days" },
          { section: "8.7", indicator: "Recurrence of cases", measurementMethod: "Recurrence percentage", target: "Continuous annual decline" },
        ],
        "9": [
          { section: "9.1", indicator: "Completeness of performance reports", measurementMethod: "Number of approved reports", target: "100%" },
          { section: "9.1", indicator: "Achievement of performance objectives", measurementMethod: "Completion percentage", target: "≥ 90%" },
          { section: "9.1", indicator: "Effectiveness of improvements", measurementMethod: "Comparison results", target: "Continuous improvement" },
          { section: "9.2", indicator: "Audit plan implementation", measurementMethod: "Completion percentage", target: "100%" },
          { section: "9.2", indicator: "Closing observations", measurementMethod: "Average closure time", target: "≤ 30 days" },
          { section: "9.2", indicator: "Reduction in non-conformance recurrence", measurementMethod: "Recurrence percentage", target: "Continuous annual decline" },
          { section: "9.3", indicator: "Conducting review meetings", measurementMethod: "Number of meetings", target: "At least 2 per year" },
          { section: "9.3", indicator: "Implementation of review decisions", measurementMethod: "Follow-up reports", target: "≥ 90%" },
          { section: "9.3", indicator: "Improvement in overall performance indicators", measurementMethod: "Annual comparison", target: "Continuous improvement" },
        ],
        "10": [
          { section: "10.1", indicator: "Closing non-conformance cases", measurementMethod: "Average closure time", target: "≤ 30 days" },
          { section: "10.1", indicator: "Reduction in problem recurrence", measurementMethod: "Recurrence percentage", target: "Continuous annual decline" },
          { section: "10.1", indicator: "Number of improvement initiatives", measurementMethod: "Annual reports", target: "Continuous increase" },
          { section: "10.2", indicator: "Beneficiary satisfaction rate", measurementMethod: "Survey results", target: "≥ 90%" },
          { section: "10.2", indicator: "Number of improvement initiatives", measurementMethod: "Annual reports", target: "Continuous increase" },
          { section: "10.2", indicator: "Reduction in complaints", measurementMethod: "Complaints register", target: "Annual decline" },
          { section: "10.3", indicator: "Complaint processing time", measurementMethod: "Average time", target: "≤ 5 days" },
          { section: "10.3", indicator: "Rate of complaint closure", measurementMethod: "Complaints register", target: "100%" },
          { section: "10.3", indicator: "Beneficiary satisfaction with resolution", measurementMethod: "Follow-up results", target: "≥ 90%" },
        ],
      };

      const seedData = seedMap[prefix] || [];
      const results = [];
      for (const item of seedData) {
        const result = await storage.createLeadershipKpiData({ ...item, actualValue: "", period: "" });
        results.push(result);
      }
      res.status(201).json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to seed section KPI data" });
    }
  });

  // Personal Documents
  app.get("/api/personal-documents", async (_req, res) => {
    try {
      const docs = await storage.getAllPersonalDocuments();
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch personal documents" });
    }
  });

  app.post("/api/personal-documents", async (req, res) => {
    try {
      const data = insertPersonalDocumentSchema.parse(req.body);
      const doc = await storage.createPersonalDocument(data);
      res.status(201).json(doc);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/personal-documents/:id", async (req, res) => {
    try {
      await storage.deletePersonalDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Auto-seed default users on startup
  (async () => {
    try {
      const existingAdmin = await storage.getUserByEmail("saloua@edsa.ae");
      if (!existingAdmin) {
        const hashedPw = await bcrypt.hash("Admin@2024", 10);
        await storage.createUser({
          username: "saloua",
          password: hashedPw,
          fullName: "Saloua",
          email: "saloua@edsa.ae",
          role: "admin",
          department: "Administration",
        });
        console.log("Seeded admin user: saloua@edsa.ae");
      }
      const existingQm = await storage.getUserByEmail("qm@edsa.ae");
      if (!existingQm) {
        const hashedPw = await bcrypt.hash("Qm@2024", 10);
        await storage.createUser({
          username: "quality_manager",
          password: hashedPw,
          fullName: "Quality Manager",
          email: "qm@edsa.ae",
          role: "quality_manager",
          department: "Quality",
        });
        console.log("Seeded quality manager user: qm@edsa.ae");
      }
      const existingAuditor = await storage.getUserByEmail("auditor@edsa.ae");
      if (!existingAuditor) {
        const hashedPw = await bcrypt.hash("Auditor@2024", 10);
        await storage.createUser({
          username: "auditor",
          password: hashedPw,
          fullName: "Auditor",
          email: "auditor@edsa.ae",
          role: "auditor",
          department: "Quality",
        });
        console.log("Seeded auditor user: auditor@edsa.ae");
      }
    } catch (e) {
      console.error("Failed to seed default users:", e);
    }
  })();

  return httpServer;
}
