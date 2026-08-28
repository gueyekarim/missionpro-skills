ALTER TABLE "evidence"
  ADD COLUMN "practiceActivityId" UUID,
  ADD COLUMN "practiceSubmissionId" UUID,
  ADD COLUMN "practiceAssessmentAttemptId" UUID,
  ADD COLUMN "skillCode" TEXT,
  ADD COLUMN "criteriaSnapshot" JSONB,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Self-declared',
  ADD COLUMN "provenance" TEXT NOT NULL DEFAULT 'Self-declared',
  ADD COLUMN "validationRequired" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "evidence_userId_capabilityId_status_idx" ON "evidence"("userId", "capabilityId", "status");
CREATE UNIQUE INDEX "evidence_userId_practiceSubmissionId_key" ON "evidence"("userId", "practiceSubmissionId");

ALTER TABLE "evidence" ADD CONSTRAINT "evidence_practiceActivityId_fkey" FOREIGN KEY ("practiceActivityId") REFERENCES "practice_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_practiceSubmissionId_fkey" FOREIGN KEY ("practiceSubmissionId") REFERENCES "practice_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_practiceAssessmentAttemptId_fkey" FOREIGN KEY ("practiceAssessmentAttemptId") REFERENCES "practice_assessment_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;