-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'VERIFIED', 'ACCEPTED', 'WAITING_LIST', 'NOT_ACCEPTED', 'SPONSORED', 'EXITED');

-- CreateEnum
CREATE TYPE "ApplicationSource" AS ENUM ('ONLINE', 'PAPER');

-- CreateEnum
CREATE TYPE "CompletedBy" AS ENUM ('CARETAKER', 'IACEC_MEMBER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ChildStatus" AS ENUM ('LOST_FATHER', 'LOST_MOTHER', 'LOST_BOTH');

-- CreateEnum
CREATE TYPE "ParentRole" AS ENUM ('FATHER', 'MOTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BIRTH_CERTIFICATE', 'DEATH_PROOF', 'CARETAKER_ID', 'REPORT_CARD', 'FEES_RECEIPT', 'PASSPORT_PHOTO', 'RECOMMENDATION', 'REFERENCE_ID', 'CHILD_PHOTO', 'VISIT_PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('HOME', 'SCHOOL', 'PHONE', 'FELLOWSHIP');

-- CreateEnum
CREATE TYPE "Wellbeing" AS ENUM ('GOOD', 'FAIR', 'CONCERN');

-- CreateEnum
CREATE TYPE "VisitFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "SponsorStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SponsorshipStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('REALTIME', 'DAILY', 'MONTHLY', 'MANUAL');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "ChildApplication" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NEW',
    "source" "ApplicationSource" NOT NULL DEFAULT 'ONLINE',
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "completedBy" "CompletedBy" NOT NULL DEFAULT 'CARETAKER',
    "helperName" TEXT,
    "helperPhone" TEXT,
    "assignedToId" TEXT,
    "documentsComplete" BOOLEAN NOT NULL DEFAULT false,
    "photoConsent" BOOLEAN NOT NULL DEFAULT false,
    "declarations" JSONB NOT NULL DEFAULT '{}',
    "signatureName" TEXT,
    "signatureDate" TIMESTAMP(3),
    "signatureKey" TEXT,
    "exitReason" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "placeOfBirth" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "church" TEXT,
    "status" "ChildStatus" NOT NULL,
    "healthNotes" TEXT,
    "interests" TEXT,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "role" "ParentRole" NOT NULL,
    "fullName" TEXT,
    "deceased" BOOLEAN NOT NULL,
    "dateOfDeath" TIMESTAMP(3),
    "causeOfDeath" TEXT,
    "occupation" TEXT,
    "hometown" TEXT,
    "certificateAvailable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sibling" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,

    CONSTRAINT "Sibling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caretaker" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "relationshipOther" TEXT,
    "livingSince" TIMESTAMP(3),
    "phones" TEXT[],
    "email" TEXT,
    "address" TEXT NOT NULL,
    "income" TEXT,
    "householdSize" INTEGER,
    "otherChildren" INTEGER,
    "nationalId" TEXT NOT NULL,
    "church" TEXT,
    "pastorName" TEXT,
    "willingMember" BOOLEAN,

    CONSTRAINT "Caretaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyReference" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "willing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FamilyReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareTeamMember" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "connection" TEXT,
    "frequency" "VisitFrequency",

    CONSTRAINT "CareTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "referredBy" TEXT NOT NULL,
    "relationship" TEXT,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolRecord" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "term" TEXT,
    "school" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "schoolAddress" TEXT,
    "headteacherPhone" TEXT,
    "feesDue" INTEGER NOT NULL,
    "feesDueDate" TIMESTAMP(3),
    "feesOwed" INTEGER,
    "results" TEXT,
    "currentPayer" TEXT,
    "materialNeeds" TEXT[],
    "materialOther" TEXT,
    "urgentNeeds" TEXT,
    "supportReceived" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "schoolRecordId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "paidBy" TEXT,
    "receiptDocumentId" TEXT,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialSupport" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "givenAt" TIMESTAMP(3) NOT NULL,
    "value" INTEGER,
    "givenBy" TEXT,

    CONSTRAINT "MaterialSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "visitLogId" TEXT,
    "type" "DocumentType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3),
    "visitedBy" TEXT,
    "findings" TEXT,
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "recommendation" TEXT,
    "decision" "ApplicationStatus",
    "decisionReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusChange" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "from" "ApplicationStatus",
    "to" "ApplicationStatus" NOT NULL,
    "reason" TEXT,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "emailed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitLog" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "byName" TEXT NOT NULL,
    "type" "VisitType" NOT NULL,
    "notes" TEXT,
    "wellbeing" "Wellbeing" NOT NULL DEFAULT 'GOOD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "country" TEXT,
    "organisation" TEXT,
    "status" "SponsorStatus" NOT NULL DEFAULT 'PROSPECT',
    "submissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "feesCommitted" INTEGER,
    "materialCommitment" TEXT,
    "frequency" TEXT,
    "status" "SponsorshipStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Sponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorReport" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "childId" TEXT,
    "term" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SponsorReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldChange" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRun" (
    "id" TEXT NOT NULL,
    "type" "BackupType" NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "filesUploaded" INTEGER NOT NULL DEFAULT 0,
    "bytes" BIGINT NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "BackupRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveSync" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "checksum" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriveSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "keys" TEXT[],
    "ipHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceCounter" (
    "year" INTEGER NOT NULL,
    "last" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReferenceCounter_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "DeletionTombstone" (
    "reference" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedById" TEXT,

    CONSTRAINT "DeletionTombstone_pkey" PRIMARY KEY ("reference")
);

-- CreateTable
CREATE TABLE "SponsorshipSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "programmeName" TEXT NOT NULL DEFAULT 'Child Sponsorship Programme',
    "targetChildren" INTEGER NOT NULL DEFAULT 12,
    "recipients" TEXT[],
    "fieldOverrides" JSONB NOT NULL DEFAULT '{}',
    "retentionMonths" INTEGER NOT NULL DEFAULT 84,
    "keepDailyBackups" INTEGER NOT NULL DEFAULT 30,
    "encryptBackups" BOOLEAN NOT NULL DEFAULT true,
    "driveFolderId" TEXT,
    "googleRefreshToken" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorshipSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChildApplication_reference_key" ON "ChildApplication"("reference");

-- CreateIndex
CREATE INDEX "ChildApplication_status_createdAt_idx" ON "ChildApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ChildApplication_assignedToId_idx" ON "ChildApplication"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "Child_applicationId_key" ON "Child"("applicationId");

-- CreateIndex
CREATE INDEX "Child_fullName_idx" ON "Child"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_applicationId_role_key" ON "Parent"("applicationId", "role");

-- CreateIndex
CREATE INDEX "Sibling_childId_idx" ON "Sibling"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "Caretaker_applicationId_key" ON "Caretaker"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyReference_applicationId_position_key" ON "FamilyReference"("applicationId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CareTeamMember_applicationId_position_key" ON "CareTeamMember"("applicationId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_applicationId_key" ON "Referral"("applicationId");

-- CreateIndex
CREATE INDEX "SchoolRecord_applicationId_schoolYear_idx" ON "SchoolRecord"("applicationId", "schoolYear");

-- CreateIndex
CREATE INDEX "FeePayment_schoolRecordId_idx" ON "FeePayment"("schoolRecordId");

-- CreateIndex
CREATE INDEX "MaterialSupport_childId_idx" ON "MaterialSupport"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationDocument_storageKey_key" ON "ApplicationDocument"("storageKey");

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_type_idx" ON "ApplicationDocument"("applicationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_applicationId_key" ON "Verification"("applicationId");

-- CreateIndex
CREATE INDEX "StatusChange_applicationId_createdAt_idx" ON "StatusChange"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "VisitLog_childId_date_idx" ON "VisitLog"("childId", "date");

-- CreateIndex
CREATE INDEX "VisitLog_wellbeing_idx" ON "VisitLog"("wellbeing");

-- CreateIndex
CREATE UNIQUE INDEX "Sponsor_submissionId_key" ON "Sponsor"("submissionId");

-- CreateIndex
CREATE INDEX "Sponsorship_sponsorId_idx" ON "Sponsorship"("sponsorId");

-- CreateIndex
CREATE INDEX "Sponsorship_childId_idx" ON "Sponsorship"("childId");

-- CreateIndex
CREATE INDEX "SponsorReport_sponsorId_idx" ON "SponsorReport"("sponsorId");

-- CreateIndex
CREATE INDEX "InternalNote_applicationId_createdAt_idx" ON "InternalNote"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "FieldChange_applicationId_createdAt_idx" ON "FieldChange"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BackupRun_startedAt_idx" ON "BackupRun"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DriveSync_entity_entityId_key" ON "DriveSync"("entity", "entityId");

-- CreateIndex
CREATE INDEX "Job_status_runAt_idx" ON "Job"("status", "runAt");

-- CreateIndex
CREATE UNIQUE INDEX "UploadSession_token_key" ON "UploadSession"("token");

-- CreateIndex
CREATE INDEX "UploadSession_expiresAt_idx" ON "UploadSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "ChildApplication" ADD CONSTRAINT "ChildApplication_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ChildApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ChildApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sibling" ADD CONSTRAINT "Sibling_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caretaker" ADD CONSTRAINT "Caretaker_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ChildApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyReference" ADD CONSTRAINT "FamilyReference_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ChildApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareTeamMember" ADD CONSTRAINT "CareTeamMember_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ChildApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ChildApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolRecord" ADD CONSTRAINT "SchoolRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ChildApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_schoolRecordId_fkey" FOREIGN KEY ("schoolRecordId") REFERENCES "SchoolRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_receiptDocumentId_fkey" FOREIGN KEY ("receiptDocumentId") REFERENCES "ApplicationDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialSupport" ADD CONSTRAINT "MaterialSupport_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ChildApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_visitLogId_fkey" FOREIGN KEY ("visitLogId") REFERENCES "VisitLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ChildApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusChange" ADD CONSTRAINT "StatusChange_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ChildApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitLog" ADD CONSTRAINT "VisitLog_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorReport" ADD CONSTRAINT "SponsorReport_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ChildApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldChange" ADD CONSTRAINT "FieldChange_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ChildApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
