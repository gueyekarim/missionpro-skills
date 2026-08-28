CREATE TABLE "personal_capability_paths" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "capabilityId" UUID NOT NULL,
    "diagnosticSessionId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "observedLevel" INTEGER NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "capabilityGap" INTEGER NOT NULL,
    "weaknessesSnapshot" JSONB NOT NULL,
    "evidenceSnapshot" JSONB NOT NULL,
    "skillsSnapshot" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "provenance" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "personal_capability_paths_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "personal_path_items" (
    "id" UUID NOT NULL,
    "pathId" UUID NOT NULL,
    "capabilityId" UUID NOT NULL,
    "learningUnitId" UUID,
    "sequence" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "completionCondition" TEXT NOT NULL,
    "gapRationale" TEXT NOT NULL,
    "skillCode" TEXT,
    "targetLevel" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "personal_path_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "personal_capability_paths_userId_capabilityId_createdAt_idx" ON "personal_capability_paths"("userId", "capabilityId", "createdAt");
CREATE UNIQUE INDEX "personal_path_items_pathId_sequence_key" ON "personal_path_items"("pathId", "sequence");
CREATE INDEX "personal_path_items_capabilityId_idx" ON "personal_path_items"("capabilityId");

ALTER TABLE "personal_capability_paths" ADD CONSTRAINT "personal_capability_paths_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_capability_paths" ADD CONSTRAINT "personal_capability_paths_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_capability_paths" ADD CONSTRAINT "personal_capability_paths_diagnosticSessionId_fkey" FOREIGN KEY ("diagnosticSessionId") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_path_items" ADD CONSTRAINT "personal_path_items_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "personal_capability_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_path_items" ADD CONSTRAINT "personal_path_items_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_path_items" ADD CONSTRAINT "personal_path_items_learningUnitId_fkey" FOREIGN KEY ("learningUnitId") REFERENCES "learning_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;