-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ConnectorStatus" AS ENUM ('DRAFT', 'CONNECTED', 'ERROR');

-- CreateTable
CREATE TABLE "LoginUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "reportEmail" BOOLEAN NOT NULL DEFAULT true,
    "reportSlack" BOOLEAN NOT NULL DEFAULT true,
    "reportTeams" BOOLEAN NOT NULL DEFAULT false,
    "reportTelegram" BOOLEAN NOT NULL DEFAULT false,
    "reportMessageTemplate" TEXT NOT NULL DEFAULT 'Ghost Labor report finished. Run {{run_id}} status: {{status}}. Findings: {{findings}}. Potential monthly savings: {{savings}}. Finished at: {{finished_at}}.',
    "reportToEmails" TEXT NOT NULL DEFAULT '',
    "smtpHost" TEXT NOT NULL DEFAULT '',
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "smtpUser" TEXT NOT NULL DEFAULT '',
    "smtpPass" TEXT NOT NULL DEFAULT '',
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "smtpFromEmail" TEXT NOT NULL DEFAULT '',
    "smtpReplyTo" TEXT NOT NULL DEFAULT '',
    "slackWebhookUrl" TEXT NOT NULL DEFAULT '',
    "teamsWebhookUrl" TEXT NOT NULL DEFAULT '',
    "slackChannel" TEXT NOT NULL DEFAULT '',
    "telegramBotToken" TEXT NOT NULL DEFAULT '',
    "telegramChatId" TEXT NOT NULL DEFAULT '',
    "scheduleHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaaSApp" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'Unknown',
    "apiBaseUrl" TEXT,
    "apiToken" TEXT,
    "connectorStatus" "ConnectorStatus" NOT NULL DEFAULT 'DRAFT',
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "lastValidationAt" TIMESTAMP(3),
    "lastValidationMessage" TEXT,
    "monthlySeatPrice" DECIMAL(10,2) NOT NULL,
    "inactivityDays" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaaSApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaaSSeat" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "employeeId" TEXT,
    "assigneeEmail" TEXT NOT NULL,
    "assignmentStatus" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "externalSeatId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "firstAssignedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaaSSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "totalFindings" INTEGER NOT NULL DEFAULT 0,
    "estimatedMonthlySave" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "AuditRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteFinding" (
    "id" TEXT NOT NULL,
    "auditRunId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "inactivityDays" INTEGER,
    "monthlySeatPrice" DECIMAL(10,2) NOT NULL,
    "estimatedMonthlySave" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WasteFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginUser_username_key" ON "LoginUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SaaSApp_slug_key" ON "SaaSApp"("slug");

-- CreateIndex
CREATE INDEX "SaaSSeat_appId_assignmentStatus_idx" ON "SaaSSeat"("appId", "assignmentStatus");

-- CreateIndex
CREATE INDEX "SaaSSeat_employeeId_idx" ON "SaaSSeat"("employeeId");

-- CreateIndex
CREATE INDEX "SaaSSeat_assigneeEmail_idx" ON "SaaSSeat"("assigneeEmail");

-- CreateIndex
CREATE INDEX "WasteFinding_auditRunId_idx" ON "WasteFinding"("auditRunId");

-- CreateIndex
CREATE INDEX "WasteFinding_appId_idx" ON "WasteFinding"("appId");

-- AddForeignKey
ALTER TABLE "SaaSSeat" ADD CONSTRAINT "SaaSSeat_appId_fkey" FOREIGN KEY ("appId") REFERENCES "SaaSApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaaSSeat" ADD CONSTRAINT "SaaSSeat_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteFinding" ADD CONSTRAINT "WasteFinding_auditRunId_fkey" FOREIGN KEY ("auditRunId") REFERENCES "AuditRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

