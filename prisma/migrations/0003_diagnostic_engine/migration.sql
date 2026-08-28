-- MissionPro Skills Sprint 2 Diagnostic Engine
CREATE TABLE "diagnostic_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "capabilityId" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "method" JSONB NOT NULL,
  "responses" JSONB NOT NULL,
  "observedLevel" INTEGER NOT NULL,
  "targetLevel" INTEGER NOT NULL,
  "capabilityGap" INTEGER NOT NULL,
  "strengths" JSONB NOT NULL,
  "weaknesses" JSONB NOT NULL,
  "missingEvidence" JSONB NOT NULL,
  "evidenceSupportingDiagnosis" JSONB NOT NULL,
  "explanation" TEXT NOT NULL,
  "recommendedPriorities" JSONB NOT NULL,
  "provenance" TEXT NOT NULL,
  "confidenceScore" DECIMAL(5,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "diagnostic_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "diagnostic_sessions_userId_capabilityId_createdAt_idx" ON "diagnostic_sessions"("userId","capabilityId","createdAt");
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;