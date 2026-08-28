CREATE TABLE "tutor_interactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "capabilityId" UUID NOT NULL,
    "pathId" UUID,
    "pathItemId" UUID,
    "mode" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "observedLevel" INTEGER NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "stage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tutor_interactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tutor_interactions_userId_capabilityId_createdAt_idx" ON "tutor_interactions"("userId", "capabilityId", "createdAt");

ALTER TABLE "tutor_interactions" ADD CONSTRAINT "tutor_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tutor_interactions" ADD CONSTRAINT "tutor_interactions_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tutor_interactions" ADD CONSTRAINT "tutor_interactions_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "personal_capability_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tutor_interactions" ADD CONSTRAINT "tutor_interactions_pathItemId_fkey" FOREIGN KEY ("pathItemId") REFERENCES "personal_path_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;