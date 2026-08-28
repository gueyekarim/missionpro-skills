CREATE TABLE "practice_activities" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "capabilityId" UUID NOT NULL,
    "pathItemId" UUID,
    "assessmentId" UUID,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "masteryLevel" INTEGER NOT NULL,
    "skillCode" TEXT,
    "gapRationale" TEXT NOT NULL,
    "assessmentCriteria" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "practice_activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "practice_submissions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "production" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "practice_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "practice_assessment_attempts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "criterionScores" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "missingElements" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "recommendedNextAction" TEXT NOT NULL,
    "masteryRecommendation" TEXT,
    "provenance" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AI assessed',
    "contestReason" TEXT,
    "contestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "practice_assessment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "practice_activities_userId_capabilityId_type_key" ON "practice_activities"("userId", "capabilityId", "type");
CREATE INDEX "practice_activities_userId_capabilityId_createdAt_idx" ON "practice_activities"("userId", "capabilityId", "createdAt");
CREATE INDEX "practice_submissions_userId_activityId_submittedAt_idx" ON "practice_submissions"("userId", "activityId", "submittedAt");
CREATE INDEX "practice_assessment_attempts_userId_activityId_createdAt_idx" ON "practice_assessment_attempts"("userId", "activityId", "createdAt");

ALTER TABLE "practice_activities" ADD CONSTRAINT "practice_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practice_activities" ADD CONSTRAINT "practice_activities_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practice_activities" ADD CONSTRAINT "practice_activities_pathItemId_fkey" FOREIGN KEY ("pathItemId") REFERENCES "personal_path_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "practice_activities" ADD CONSTRAINT "practice_activities_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "practice_submissions" ADD CONSTRAINT "practice_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practice_submissions" ADD CONSTRAINT "practice_submissions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "practice_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practice_assessment_attempts" ADD CONSTRAINT "practice_assessment_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practice_assessment_attempts" ADD CONSTRAINT "practice_assessment_attempts_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "practice_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practice_assessment_attempts" ADD CONSTRAINT "practice_assessment_attempts_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "practice_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;