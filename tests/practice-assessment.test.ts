import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NovaOrchestrator, mockProvider } from "../src/server/nova/orchestrator";
import { assessorOutputSchema, practiceTypes } from "../src/server/nova/context-contract";
import { mp001Rubric } from "../src/server/practice";

const activity = {
  id: "00000000-0000-4000-8000-000000000020",
  type: "challenge",
  title: "MP-001 reference challenge",
  assessmentCriteria: mp001Rubric
};

function context(production: string) {
  return {
    user: { id: "00000000-0000-4000-8000-000000000010" },
    currentCapability: { code: "CAP-PROJ-RISK-001", name: "Identifier et prioriser les risques d’un projet public" },
    observedMasteryLevel: 3,
    targetMasteryLevel: 4,
    currentPracticeActivity: activity,
    currentProduction: production,
    recentAssessments: [],
    evidenceAvailable: [],
    weaknessesOrGaps: ["Arbitrage complexe à renforcer."]
  };
}

const weakProduction = "Je convoque une réunion avec l’équipe pour discuter du problème et décider ensemble de la suite du projet.";
const strongProduction = `
Matrice et tableau de risques. Risque / menace / événement 1 : défaillance fournisseur.
Probabilité 4/5, impact 5/5, criticité 20 : priorité haute et urgente.
Risque / menace / événement 2 : défaut d’accessibilité. Probabilité 3/5, impact 5/5, criticité 15 : priorité 2.
Je justifie et compare cet arbitrage car le premier bloque le chemin critique.
Réponse et traitement : atténuation par tests quotidiens ; action suivie par le responsable technique.
Pour le second, action corrective avec responsable accessibilité. Ce livrable sera revu en comité.
`;

describe("Sprint 4 Practice and Assessment contracts", () => {
  it("supports all required capability-first practice modes", () => {
    assert.deepEqual(practiceTypes, ["exercise", "case", "challenge", "simulation", "real_work"]);
  });

  it("uses the complete weighted MP-001 rubric", () => {
    assert.deepEqual(mp001Rubric.map((criterion) => criterion.code), [
      "risk_identification", "probability_impact", "prioritization",
      "treatment_strategy", "reasoning", "professional_output"
    ]);
    assert.equal(mp001Rubric.reduce((sum, criterion) => sum + criterion.weight, 0), 1);
  });

  it("gives weak and strong productions materially different assessments", async () => {
    const orchestrator = new NovaOrchestrator(mockProvider);
    const weak = await orchestrator.runAssessor(context(weakProduction), JSON.stringify({ activity, production: weakProduction }));
    const strong = await orchestrator.runAssessor(context(strongProduction), JSON.stringify({ activity, production: strongProduction }));
    assert.ok(weak.overallScore < strong.overallScore);
    assert.ok(weak.missingElements.length > strong.missingElements.length);
    assert.notEqual(weak.recommendedNextAction, strong.recommendedNextAction);
    assert.match(weak.masteryRecommendation, /Ne recommande pas encore/i);
    assert.match(strong.masteryRecommendation, /revue humaine/i);
  });

  it("rejects malformed or unexplainable Assessor output", async () => {
    const orchestrator = new NovaOrchestrator(async () => ({ overallScore: 100, provenance: "Externally certified" }));
    await assert.rejects(
      orchestrator.runAssessor(context(strongProduction), JSON.stringify({ activity, production: strongProduction })),
      /valid structured assessment/
    );
  });

  it("preserves AI-assessed provenance without changing verified mastery", async () => {
    const result = await new NovaOrchestrator(mockProvider).runAssessor(context(strongProduction), JSON.stringify({ activity, production: strongProduction }));
    assert.equal(assessorOutputSchema.parse(result).provenance, "AI assessed");
    assert.ok(result.limitations.some((item) => /validation humaine/i.test(item)));
    const service = readFileSync("src/server/practice.ts", "utf8");
    assert.doesNotMatch(service, /userCapability\.(update|upsert)/);
  });
});