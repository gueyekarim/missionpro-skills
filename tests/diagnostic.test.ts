import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateDiagnostic, diagnosticMethods, getDiagnosticInstrument } from "../src/server/diagnostics";
import { diagnosticOutputSchema } from "../src/server/nova/context-contract";
import { NovaOrchestrator } from "../src/server/nova/orchestrator";

const capability = {
  code: "CAP-PROJ-RISK-001",
  name: "Identifier et prioriser les risques d’un projet public",
  targetLevel: 4,
  observableTasks: ["Construire une matrice de risques."],
  knowledgeRequirements: ["Probabilité, impact et criticité."],
  evidenceRequirements: ["Matrice de risques contextualisée."]
};

const weakResponses = {
  selfAssessment: 5,
  knowledgeAnswer: "Je commencerais par lire les documents disponibles.",
  miniCaseAnswer: "Je réunirais les parties prenantes pour discuter.",
  productionAnswer: "Je rédigerais un document synthétique après la réunion."
};

const strongResponses = {
  selfAssessment: 2,
  knowledgeAnswer: "J’analyse le contexte, la probabilité, l’impact et la criticité de chaque événement.",
  miniCaseAnswer: "Je construis une matrice, je priorise, définis une réponse et nomme un responsable.",
  productionAnswer: "Risque fournisseur : probabilité haute, impact fort, priorité 1, réponse de mitigation, responsable achats."
};

describe("Sprint 2 Diagnostic Engine contracts", () => {
  it("combines self-assessment with three observable methods", () => {
    const instrument = getDiagnosticInstrument(capability);
    assert.deepEqual(instrument.methods, [...diagnosticMethods]);
    assert.equal(instrument.items.length, 3);
    assert.deepEqual(instrument.items.map((item) => item.method), ["knowledge_question", "mini_case", "short_production"]);
  });

  it("does not let self-assessment alone establish the observed level", () => {
    const result = calculateDiagnostic(capability, weakResponses);
    assert.equal(weakResponses.selfAssessment, 5);
    assert.equal(result.observedLevel, 1);
    assert.equal(result.capabilityGap, 3);
    assert.equal(result.evidenceSupportingDiagnosis.length, 3);
  });

  it("preserves Required Capability minus Observed Capability equals Gap", () => {
    const result = calculateDiagnostic(capability, strongResponses);
    assert.equal(result.targetLevel, 4);
    assert.equal(result.observedLevel, 4);
    assert.equal(result.capabilityGap, 0);
    assert.equal(result.targetLevel - result.observedLevel, result.capabilityGap);
  });

  it("validates explainable AI-assessed diagnostic output", async () => {
    const calculated = calculateDiagnostic(capability, weakResponses);
    const output = {
      observedLevel: calculated.observedLevel,
      targetLevel: calculated.targetLevel,
      capabilityGap: calculated.capabilityGap,
      strengths: calculated.strengths,
      weaknesses: calculated.weaknesses,
      missingEvidence: calculated.missingEvidence,
      evidenceSupportingDiagnosis: calculated.evidenceSupportingDiagnosis,
      explanation: "Le niveau observé repose sur les réponses aux trois activités.",
      recommendedPriorities: calculated.recommendedPriorities,
      provenance: "AI assessed" as const,
      confidenceScore: calculated.confidenceScore
    };
    assert.equal(diagnosticOutputSchema.parse(output).provenance, "AI assessed");
    const orchestrator = new NovaOrchestrator(async ({ mode, output: outputType }) => {
      assert.equal(mode, "diagnostician");
      assert.equal(outputType, "diagnostic");
      return output;
    });
    const result = await orchestrator.runDiagnostician(
      { targetMasteryLevel: 4, recentAssessments: [], evidenceAvailable: [], weaknessesOrGaps: [] },
      JSON.stringify(output)
    );
    assert.equal(result.explanation, output.explanation);
  });

  it("rejects malformed diagnostician output", async () => {
    const orchestrator = new NovaOrchestrator(async () => ({ observedLevel: 5, targetLevel: 4, capabilityGap: -1 }));
    await assert.rejects(
      orchestrator.runDiagnostician(
        { recentAssessments: [], evidenceAvailable: [], weaknessesOrGaps: [] },
        "invalid"
      ),
      /valid diagnostic/
    );
  });
});