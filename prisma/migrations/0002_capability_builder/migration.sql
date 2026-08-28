-- MissionPro Skills Sprint 1 Capability Builder
ALTER TABLE "capabilities"
  ADD COLUMN "sourceIntent" TEXT,
  ADD COLUMN "outcomes" JSONB,
  ADD COLUMN "knowledgeRequirements" JSONB,
  ADD COLUMN "observableTasks" JSONB;

UPDATE "skills" SET "code" = 'SKILL-RISK-CONTEXT' WHERE "code" = 'RISK-CONTEXT';
UPDATE "skills" SET "code" = 'SKILL-RISK-QUALIFICATION' WHERE "code" = 'RISK-QUALIFICATION';
UPDATE "skills" SET "code" = 'SKILL-RISK-PRIORITIZATION' WHERE "code" = 'RISK-PRIORITIZATION';