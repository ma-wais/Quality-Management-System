# ISO 9001:2015 Quality Management System (QMS Pro)

## Overview
QMS Pro is a comprehensive Quality Management System designed to be fully compliant with ISO 9001:2015 standards. It provides full traceability and management for all quality processes, including documents, audits, corrective actions, and more. The system features role-based access control, dynamic KPI dashboards, and a complete audit trail to ensure robust quality assurance and continuous improvement.

## User Preferences
I prefer clear, professional language.
I value a structured and systematic approach to development.
Please ensure all new features are well-documented and integrated seamlessly.
I prefer to be asked before any major architectural changes are made.
Prioritize security and data integrity in all implementations.

## System Architecture
QMS Pro is built with a modern web stack, featuring a React, TypeScript, and Vite frontend utilizing Shadcn UI and Recharts for a professional blue/gray themed interface. The backend is an Express.js and TypeScript API, interacting with a PostgreSQL database via Drizzle ORM.

**Key Architectural Decisions:**
- **Modular Design**: The application's structure is organized around ISO 9001:2015 clauses (4-10), with dedicated modules for each section (e.g., Context of the Organization, Leadership, Planning).
- **Role-Based Access Control**: Implemented with a `role_permissions` table allowing granular control over submenu access, dynamically filtering sidebar navigation based on user roles.
- **Data Traceability**: UUID primary keys for all database tables ensure unique identification and facilitate audit trails.
- **Dynamic KPI Dashboards**: Configurable dashboards with charts (e.g., vertical bar charts with `LabelList`) to visualize performance against targets and enable PDF/image export.
- **Multi-language Support**: Full bilingual capabilities (English/Arabic) with RTL layout support across the application.
- **Notification System**: Real-time notification bell for new record creations across modules, with unread counts and direct navigation.
- **Authentication**: Session-based authentication using `express-session` and `connect-pg-simple`, featuring email/password login, password reset functionality, and secure SMTP configuration for email delivery.
- **UI/UX**: Consistent form patterns, dark mode support, and a professional aesthetic aligning with enterprise QMS requirements.

**Core Features:**
- **ISO Clause Modules**: Comprehensive coverage for all ISO 9001:2015 clauses (4-10), including Context, Leadership, Planning, Support, Operation, Performance Evaluation, and Improvement.
- **Document Control**: Versioning, approval workflows, and status tracking for controlled documents.
- **Risk & Opportunity Management**: Registers for tracking risks and opportunities with scoring and mitigation actions.
- **Performance Management**: KPI tracking with progress, targets, and review workflows for quality objectives, audit findings, and management reviews.
- **Corrective Actions (CARs)**: Management of nonconformities, root cause analysis, and corrective action tracking.
- **Evidence Management**: Reusable file upload component (`EvidenceUpload`) for attaching diverse file types (images, PDFs) across all modules.

## External Dependencies
- **PostgreSQL**: Primary database for data storage.
- **Neon**: Managed PostgreSQL service.
- **Drizzle ORM**: TypeScript ORM for database interaction.
- **React**: Frontend library.
- **TypeScript**: Programming language for both frontend and backend.
- **Vite**: Frontend build tool.
- **TanStack Query**: Data fetching and caching library.
- **Wouter**: React router.
- **Shadcn UI**: UI component library.
- **Recharts**: Charting library for data visualization.
- **Tailwind CSS**: Utility-first CSS framework.
- **Express.js**: Backend web application framework.
- **`express-session`**: Session management middleware for Express.
- **`connect-pg-simple`**: PostgreSQL session store for `express-session`.
- **`bcryptjs`**: Library for password hashing.
- **`nodemailer`**: Module for sending emails (used for password resets).
- **`html2canvas`**: Library to render HTML elements into canvas (for PDF/image export).
- **`jspdf`**: Library to generate PDFs (for PDF export).