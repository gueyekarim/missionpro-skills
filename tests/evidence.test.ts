import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evidenceStatuses, saveEvidenceSchema } from "../src/server/evidence";

describe("Sprint 5A Evidence Engine contracts", () => {
  it("preserves the complete governance ladder", () => {
    assert.deepEqual(evidenceStatuses, [
      "Self-declared", "AI assessed", "Human validated", "MissionPro verified", "Externally certified"
    ]);
  });

  it("requires an assessed submission identifier instead of activity completion", () => {
    assert.equal(saveEvidenceSchema.safeParse({ submissionId: "00000000-0000-4000-8000-000000000001" }).success, true);
    assert.equal(saveEvidenceSchema.safeParse({ activityId: "00000000-0000-4000-8000-000000000001", completed: true }).success, false);
  });

  it("models traceability to activity, production, assessment, criteria and provenance", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const evidence = schema.match(/model Evidence \{([\s\S]*?)\n\}/)?.[1] ?? "";
    for (const field of [
      "practiceActivityId", "practiceSubmissionId", "practiceAssessmentAttemptId", "skillCode",
      "criteriaSnapshot", "score", "assessorType", "status", "provenance", "validationRequired", "createdAt"
    ]) assert.match(evidence, new RegExp(`\\b${field}\\b`));
  });

  it("never promotes AI evidence to verified or certified status", () => {
    const service = readFileSync("src/server/evidence.ts", "utf8");
    assert.match(service, /status: "AI assessed"/);
    assert.match(service, /verified: false/);
    assert.match(service, /validationRequired: true/);
    assert.doesNotMatch(service, /status: "(Human validated|MissionPro verified|Externally certified)"/);
  });

  it("does not update mastery when evidence is saved", () => {
    const service = readFileSync("src/server/evidence.ts", "utf8");
    assert.doesNotMatch(service, /userCapability\.(update|upsert)/);
  });
});