import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildTutorContext } from "../src/server/tutor";
import { contextContractSchema, tutorOutputSchema } from "../src/server/nova/context-contract";
import { NovaOrchestrator, mockProvider } from "../src/server/nova/orchestrator";

function snapshot(observedLevel: number, stage: string) {
  return {
    user: { id: "00000000-0000-4000-8000-000000000010", name: "Learner" },
    capability: {
      id: "00000000-0000-4000-8000-000000000001",
      code: "CAP-PROJ-RISK-001",
      name: "Identifier et prioriser les risques d’un projet public",
      description: "Analyser et prioriser les risques.",
      context: { persona: "chef de projet public" },
      knowledgeRequirements: ["Probabilité, impact et criticité."],
      observableTasks: ["Construire une matrice de risques."],
      evidenceRequirements: ["Matrice contextualisée."],
      targetLevel: 4,
      skills: [
        { requiredLevel: 3, skill: { code: "SKILL-RISK-CONTEXT", name: "Analyser le contexte", description: "Repérer les facteurs." } },
        { requiredLevel: 4, skill: { code: "SKILL-RISK-PRIORITIZATION", name: "Prioriser", description: "Justifier les réponses." } }
      ]
    },
    diagnostic: {
      id: "00000000-0000-4000-8000-000000000002",
      observedLevel,
      targetLevel: 4,
      capabilityGap: 4 - observedLevel,
      weaknesses: observedLevel < 3 ? ["Fondations à renforcer."] : ["Arbitrage complexe à renforcer."],
      evidenceSupportingDiagnosis: [{ dimension: "Mini-cas", method: "mini_case", summary: "Réponse", score: observedLevel, maxScore: 4, observedSignals: [] }],
      recommendedPriorities: ["Produire une justification explicite."]
    },
    path: {
      id: "00000000-0000-4000-8000-000000000003",
      status: "active",
      observedLevel,
      targetLevel: 4,
      capabilityGap: 4 - observedLevel,
      summary: "Parcours personnel.",
      items: [{
        id: "00000000-0000-4000-8000-000000000004",
        sequence: 1,
        stage,
        title: stage === "understand" ? "Comprendre le contexte" : "Défendre une priorisation",
        objective: "Produire un raisonnement explicable.",
        activity: "Analyser un cas de projet public.",
        expectedOutput: "Une décision argumentée.",
        completionCondition: "Les choix sont justifiés.",
        status: "not_started",
        skillCode: observedLevel < 3 ? "SKILL-RISK-CONTEXT" : "SKILL-RISK-PRIORITIZATION",
        learningUnit: null
      }]
    },
    currentItem: {
      id: "00000000-0000-4000-8000-000000000004",
      sequence: 1,
      stage,
      title: stage === "understand" ? "Comprendre le contexte" : "Défendre une priorisation",
      objective: "Produire un raisonnement explicable.",
      activity: "Analyser un cas de projet public.",
      expectedOutput: "Une décision argumentée.",
      completionCondition: "Les choix sont justifiés.",
      status: "not_started",
      skillCode: observedLevel < 3 ? "SKILL-RISK-CONTEXT" : "SKILL-RISK-PRIORITIZATION",
      learningUnit: null
    },
    previousActivities: [{ mode: "LEARN", action: "contextual_tutoring_response", stage, observedLevel, createdAt: "2026-08-28T12:00:00.000Z" }]
  } as unknown as Parameters<typeof buildTutorContext>[0];
}

describe("Sprint 3B NOVA Tutor contracts", () => {
  it("builds the Context Contract from the learner, Capability, diagnosis and current path item", () => {
    const context = buildTutorContext(snapshot(1, "understand"), { mode: "LEARN", question: "Explique-moi le point essentiel." });
    const parsed = contextContractSchema.parse(context);
    assert.equal(parsed.user?.name, "Learner");
    assert.equal(parsed.currentCapability?.code, "CAP-PROJ-RISK-001");
    assert.equal(parsed.currentCapability?.skills?.length, 2);
    assert.equal(parsed.observedMasteryLevel, 1);
    assert.equal(parsed.targetMasteryLevel, 4);
    assert.equal(parsed.currentPathItem?.stage, "understand");
    assert.equal(parsed.previousLearningActivities?.length, 1);
    assert.ok(parsed.weaknessesOrGaps.length >= 2);
  });

  it("returns meaningfully different support for two MP-001 profiles", async () => {
    const orchestrator = new NovaOrchestrator(mockProvider);
    const question = "Comment prioriser un risque fournisseur ?";
    const foundation = await orchestrator.runTutor(
      buildTutorContext(snapshot(1, "understand"), { mode: "LEARN", question }),
      JSON.stringify({ mode: "LEARN", question })
    );
    const advanced = await orchestrator.runTutor(
      buildTutorContext(snapshot(3, "challenge"), { mode: "LEARN", question }),
      JSON.stringify({ mode: "LEARN", question })
    );
    assert.notEqual(foundation.response, advanced.response);
    assert.match(foundation.teachingPoint, /repérage du contexte/i);
    assert.match(advanced.teachingPoint, /arbitrage/i);
    assert.notEqual(foundation.suggestedExercise, advanced.suggestedExercise);
  });

  it("supports LEARN, ASK NOVA and MY WORK with validated structured outputs", async () => {
    const orchestrator = new NovaOrchestrator(mockProvider);
    for (const mode of ["LEARN", "ASK NOVA", "MY WORK"] as const) {
      const question = "Aidez-moi à traiter ce risque.";
      const output = await orchestrator.runTutor(
        buildTutorContext(snapshot(3, "challenge"), { mode, question }),
        JSON.stringify({ mode, question })
      );
      assert.equal(tutorOutputSchema.parse(output).mode, mode);
      assert.ok(output.reasoningSteps.length);
      assert.ok(output.nextAction);
    }
  });

  it("rejects malformed Tutor output", async () => {
    const orchestrator = new NovaOrchestrator(async () => ({ mode: "ASK NOVA", response: "Generic answer" }));
    await assert.rejects(
      orchestrator.runTutor(
        buildTutorContext(snapshot(2, "learn"), { mode: "ASK NOVA", question: "Pourquoi ?" }),
        JSON.stringify({ mode: "ASK NOVA", question: "Pourquoi ?" })
      ),
      /valid contextual response/
    );
  });

  it("persists only minimal tutor event metadata, not conversation content", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const model = schema.match(/model TutorInteraction \{([\s\S]*?)\n\}/)?.[1] ?? "";
    assert.ok(model);
    assert.doesNotMatch(model, /question|response|message|content|prompt/i);
    assert.match(model, /mode/);
    assert.match(model, /pathItemId/);
  });
});