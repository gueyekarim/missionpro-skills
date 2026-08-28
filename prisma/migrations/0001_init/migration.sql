-- MissionPro Skills Sprint 0 foundation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "name" TEXT,
  "passwordHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "capabilities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "domain" TEXT,
  "capabilityType" TEXT NOT NULL DEFAULT 'professional',
  "purpose" TEXT,
  "businessOutcome" TEXT,
  "successCriteria" JSONB,
  "context" JSONB,
  "criticality" TEXT,
  "targetLevel" INTEGER,
  "evidenceRequirements" JSONB,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "capabilities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "capabilities_code_key" ON "capabilities"("code");

CREATE TABLE "skills" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "skillType" TEXT,
  CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "skills_code_key" ON "skills"("code");

CREATE TABLE "capability_skills" (
  "capabilityId" UUID NOT NULL,
  "skillId" UUID NOT NULL,
  "weight" DECIMAL(5,2),
  "requiredLevel" INTEGER,
  CONSTRAINT "capability_skills_pkey" PRIMARY KEY ("capabilityId","skillId")
);

CREATE TABLE "mastery_levels" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "levelNumber" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "observableBehaviors" JSONB NOT NULL,
  "minimumEvidence" INTEGER NOT NULL DEFAULT 0,
  "assessmentRules" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mastery_levels_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "mastery_levels_levelNumber_key" ON "mastery_levels"("levelNumber");
CREATE UNIQUE INDEX "mastery_levels_name_key" ON "mastery_levels"("name");

CREATE TABLE "learning_units" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "difficulty" INTEGER,
  "estimatedDuration" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "learning_units_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "capability_learning_units" (
  "capabilityId" UUID NOT NULL,
  "learningUnitId" UUID NOT NULL,
  "targetLevel" INTEGER,
  CONSTRAINT "capability_learning_units_pkey" PRIMARY KEY ("capabilityId","learningUnitId")
);

CREATE TABLE "assessments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "assessmentType" TEXT NOT NULL,
  "rubric" JSONB NOT NULL,
  "passingScore" DECIMAL(5,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "capability_assessments" (
  "capabilityId" UUID NOT NULL,
  "assessmentId" UUID NOT NULL,
  "masteryLevel" INTEGER,
  CONSTRAINT "capability_assessments_pkey" PRIMARY KEY ("capabilityId","assessmentId")
);

CREATE TABLE "evidence" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "capabilityId" UUID NOT NULL,
  "assessmentId" UUID,
  "evidenceType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "artifactUrl" TEXT,
  "artifactText" TEXT,
  "score" DECIMAL(5,2),
  "assessorType" TEXT NOT NULL,
  "assessorId" TEXT,
  "aiAssessment" JSONB,
  "humanValidation" JSONB,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "evidence_userId_capabilityId_idx" ON "evidence"("userId","capabilityId");

CREATE TABLE "user_capabilities" (
  "userId" UUID NOT NULL,
  "capabilityId" UUID NOT NULL,
  "observedLevel" INTEGER,
  "targetLevel" INTEGER,
  "confidenceScore" DECIMAL(5,2),
  "evidenceCount" INTEGER NOT NULL DEFAULT 0,
  "lastAssessedAt" TIMESTAMP(3),
  CONSTRAINT "user_capabilities_pkey" PRIMARY KEY ("userId","capabilityId")
);

CREATE TABLE "agents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "systemPrompt" TEXT NOT NULL,
  "agentType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "agents_name_key" ON "agents"("name");

CREATE TABLE "sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tokenHash" TEXT NOT NULL,
  "userId" UUID NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "capability_skills" ADD CONSTRAINT "capability_skills_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "capability_skills" ADD CONSTRAINT "capability_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "capability_learning_units" ADD CONSTRAINT "capability_learning_units_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "capability_learning_units" ADD CONSTRAINT "capability_learning_units_learningUnitId_fkey" FOREIGN KEY ("learningUnitId") REFERENCES "learning_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "capability_assessments" ADD CONSTRAINT "capability_assessments_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "capability_assessments" ADD CONSTRAINT "capability_assessments_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_capabilities" ADD CONSTRAINT "user_capabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_capabilities" ADD CONSTRAINT "user_capabilities_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;