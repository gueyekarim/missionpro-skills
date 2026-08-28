import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aggregateCapabilityMastery, masteryScale } from "../src/server/passport";

const criteria = [
  "risk_identification", "probability_impact", "prioritization",
  "treatment_strategy", "reasoning", "professional_output"
];

function evidence(options: { id?: string; score: number; status?: string; level?: number; type?: string; verified?: boolean }) {
  const score = options.score >= 85 ? 5 : options.score >= 70 ? 3 : 0;
  return {
    id: options.id ?? crypto.randomUUID(),
    score: options.score,
    status: options.status ?? "AI assessed",
    provenance: options.status ?? "AI assessed",
    assessorType: options.status === "Human validated" ? "Human" : "AI",
    verified: options.verified ?? (options.status === "MissionPro verified" || options.status === "Externally certified"),
    humanValidation: options.status === "Human validated" ? { decision: "validated" } : null,
    createdAt: new Date(),
    practiceActivity: { type: options.type ?? "challenge", title: "MP-001 reference challenge", masteryLevel: options.level ?? 3 },
    aiAssessment: {
      criterionScores: criteria.map((code) => ({ code, label: code, score, maxScore: 5 }))
    }
  };
}

describe("Sprint 5B Capability Passport contracts", () => {
  it("preserves the five-level mastery scale", () => {
    assert.deepEqual(masteryScale.map((item) => item.name), [
      "Awareness", "Assisted Practice", "Autonomous Practice", "Advanced Practice", "System Mastery"
    ]);
  });

  it("does not establish demonstrated mastery without qualifying Evidence", () => {
    const result = aggregateCapabilityMastery({ observedLevel: 2, targetLevel: 3, evidence: [] });
    assert.equal(result.demonstratedLevel, null);
    assert.equal(result.demonstratedState, "not_established");
    assert.equal(result.verifiedLevel, null);
    const selfDeclared = aggregateCapabilityMastery({
      observedLevel: 2, targetLevel: 3, evidence: [evidence({ score: 100, status: "Self-declared" })]
    });
    assert.equal(selfDeclared.demonstratedLevel, null);
  });

  it("distinguishes weak Evidence from strong AI-assessed Evidence", () => {
    const weak = aggregateCapabilityMastery({ observedLevel: 2, targetLevel: 3, evidence: [evidence({ score: 35 })] });
    const strong = aggregateCapabilityMastery({ observedLevel: 2, targetLevel: 3, evidence: [evidence({ score: 93 })] });
    assert.equal(weak.demonstratedLevel, null);
    assert.equal(weak.evidenceQuality, "weak");
    assert.equal(strong.demonstratedLevel, 3);
    assert.equal(strong.demonstratedState, "provisional");
    assert.equal(strong.masteryEstablished, false);
    assert.equal(strong.verifiedLevel, null);
  });

  it("requires consistency or validation rather than one high AI score", () => {
    const consistent = aggregateCapabilityMastery({
      observedLevel: 2,
      targetLevel: 3,
      evidence: [evidence({ id: "one", score: 90 }), evidence({ id: "two", score: 88, type: "real_work" })]
    });
    assert.equal(consistent.demonstratedLevel, 3);
    assert.equal(consistent.demonstratedState, "established");
    assert.equal(consistent.verifiedLevel, null);
  });

  it("separates human validation from MissionPro verification", () => {
    const validated = aggregateCapabilityMastery({
      observedLevel: 2, targetLevel: 3, evidence: [evidence({ score: 91, status: "Human validated" })]
    });
    const verified = aggregateCapabilityMastery({
      observedLevel: 2, targetLevel: 3, evidence: [evidence({ score: 91, status: "MissionPro verified" })]
    });
    assert.equal(validated.demonstratedState, "established");
    assert.equal(validated.verifiedLevel, null);
    assert.equal(verified.verifiedLevel, 3);
    assert.notEqual(validated.validationStatus, verified.validationStatus);
    const inflated = aggregateCapabilityMastery({
      observedLevel: 2, targetLevel: 3, evidence: [evidence({ score: 99, status: "MissionPro verified", verified: false })]
    });
    assert.equal(inflated.verifiedLevel, null);
    assert.equal(inflated.validationStatus, "AI assessed");
  });

  it("explains each supporting Evidence contribution", () => {
    const result = aggregateCapabilityMastery({
      observedLevel: 2, targetLevel: 3, evidence: [evidence({ score: 93 })]
    });
    assert.equal(result.supportingEvidence[0].criterionCoverage, 100);
    assert.equal(result.supportingEvidence[0].difficultyFactor, 1.15);
    assert.ok(result.explanation.some((rule) => rule.includes("does not average scores")));
  });

  it("has no write path that silently changes mastery", () => {
    const service = readFileSync("src/server/passport.ts", "utf8");
    assert.doesNotMatch(service, /userCapability\.(update|upsert)/);
    assert.doesNotMatch(service, /evidence\.(update|upsert)/);
  });
});