import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPersonalPathDraft } from "../src/server/paths";
import { personalPathOutputSchema } from "../src/server/nova/context-contract";
import { NovaOrchestrator } from "../src/server/nova/orchestrator";

const capability = {
  id: "00000000-0000-4000-8000-000000000001",
  code: "CAP-PROJ-RISK-001",
  name: "Identifier et prioriser les risques d’un projet public",
  description: "Analyser, qualifier et prioriser les risques.",
  knowledgeRequirements: ["Probabilité, impact, criticité et stratégies de réponse."],
  observableTasks: ["Construire une matrice de risques contextualisée."],
  evidenceRequirements: ["Matrice de risques contextualisée", "Rubric d’évaluation explicite"],
  skills: [
    { requiredLevel: 3, skill: { code: "SKILL-RISK-CONTEXT", name: "Analyser le contexte du projet", description: "Repérer les facteurs du risque." } },
    { requiredLevel: 3, skill: { code: "SKILL-RISK-QUALIFICATION", name: "Qualifier probabilité et impact", description: "Évaluer la criticité." } },
    { requiredLevel: 4, skill: { code: "SKILL-RISK-PRIORITIZATION", name: "Prioriser et justifier les réponses", description: "Décider et justifier la réponse." } }
  ],
  learningUnits: []
} as unknown as Parameters<typeof buildPersonalPathDraft>[0];

function diagnostic(observedLevel: number, weaknesses: string[]) {
  return {
    id: `00000000-0000-4000-8000-00000000000${observedLevel}`,
    observedLevel,
    targetLevel: 4,
    capabilityGap: 4 - observedLevel,
    weaknesses,
    missingEvidence: ["Matrice contextualisée évaluée."],
    evidenceSupportingDiagnosis: [
      { dimension: "Connaissances", method: "knowledge_question", summary: "Réponse", score: observedLevel, maxScore: 4, observedSignals: [] }
    ],
    recommendedPriorities: weaknesses
  } as unknown as Parameters<typeof buildPersonalPathDraft>[1];
}

describe("Sprint 3A Personal Capability Path contracts", () => {
  it("builds a traceable capability-first path from the diagnosed gap", () => {
    const path = buildPersonalPathDraft(capability, diagnostic(1, ["Connaissances et production à développer."]));
    assert.equal(path.capabilityCode, capability.code);
    assert.equal(path.targetLevel - path.observedLevel, path.capabilityGap);
    assert.ok(path.items.some((item) => item.stage === "understand"));
    assert.ok(path.items.some((item) => item.stage === "prove"));
    for (const item of path.items) {
      assert.equal(item.capabilityCode, capability.code);
      assert.ok(item.gapRationale);
      assert.ok(item.objective);
      assert.ok(item.activity);
      assert.ok(item.expectedOutput);
      assert.ok(item.completionCondition);
    }
  });

  it("generates different paths for different profiles on the same Capability", () => {
    const foundationPath = buildPersonalPathDraft(capability, diagnostic(1, ["Fondations insuffisantes."]));
    const advancedPath = buildPersonalPathDraft(capability, diagnostic(3, ["Priorisation complexe à renforcer."]));
    assert.ok(foundationPath.items.length > advancedPath.items.length);
    assert.ok(foundationPath.items.some((item) => item.stage === "understand"));
    assert.equal(advancedPath.items.some((item) => item.stage === "understand"), false);
    const advancedSkills = new Set(advancedPath.items.map((item) => item.skillCode).filter(Boolean));
    assert.deepEqual([...advancedSkills], ["SKILL-RISK-PRIORITIZATION"]);
  });

  it("does not reteach content when the target is already observed", () => {
    const path = buildPersonalPathDraft(capability, diagnostic(4, []));
    assert.deepEqual(path.items.map((item) => item.stage), ["prove", "master"]);
    assert.match(path.summary, /déjà observé/);
  });

  it("keeps completion distinct from evidence-backed mastery", () => {
    const path = buildPersonalPathDraft(capability, diagnostic(3, ["Priorisation complexe à renforcer."]));
    const masteryReview = path.items.find((item) => item.stage === "master");
    assert.ok(masteryReview);
    assert.match(masteryReview.completionCondition, /ne découle pas de la complétion/i);
    assert.equal(personalPathOutputSchema.parse(path).provenance, "AI assisted");
  });

  it("uses NOVA Mentor through the single structured orchestrator", async () => {
    const expected = buildPersonalPathDraft(capability, diagnostic(3, ["Priorisation complexe à renforcer."]));
    const orchestrator = new NovaOrchestrator(async ({ mode, output }) => {
      assert.equal(mode, "mentor");
      assert.equal(output, "path");
      return expected;
    });
    const result = await orchestrator.runPath(
      { observedMasteryLevel: 3, targetMasteryLevel: 4, recentAssessments: [], evidenceAvailable: [], weaknessesOrGaps: [] },
      JSON.stringify(expected)
    );
    assert.equal(result.items.length, expected.items.length);
  });
});