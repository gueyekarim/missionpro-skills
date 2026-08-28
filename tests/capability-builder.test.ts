import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { capabilityDraftSchema } from "../src/server/nova/context-contract";
import { NovaOrchestrator } from "../src/server/nova/orchestrator";

const referenceDraft = {
  code: "CAP-PROJ-RISK-001",
  sourceIntent: "Être capable d’identifier et prioriser les risques d’un projet public.",
  name: "Identifier et prioriser les risques d’un projet public",
  description: "Analyser, qualifier et prioriser les risques de manière explicable.",
  domain: "Gestion de projet public",
  purpose: "Éclairer les décisions de pilotage.",
  businessOutcome: "Sécuriser les résultats du projet.",
  outcomes: ["Les risques prioritaires sont rendus visibles."],
  skills: [
    {
      code: "SKILL-RISK-PRIORITIZATION",
      name: "Prioriser les risques",
      description: "Classer les risques selon leur criticité.",
      category: "decision",
      skillType: "professional",
      requiredLevel: 4
    }
  ],
  knowledgeRequirements: ["Probabilité, impact et criticité."],
  observableTasks: ["Produire une matrice de risques."],
  targetLevel: 4,
  successCriteria: ["La priorité de chaque risque est justifiée."],
  expectedEvidence: ["Matrice de risques contextualisée."]
};

describe("Sprint 1 Capability Builder contracts", () => {
  it("validates the complete MP-001 capability record", () => {
    const parsed = capabilityDraftSchema.parse(referenceDraft);
    assert.equal(parsed.code, "CAP-PROJ-RISK-001");
    assert.equal(parsed.targetLevel, 4);
    assert.equal(parsed.skills[0].requiredLevel, 4);
  });

  it("rejects a course-like or incomplete record without observable capability fields", () => {
    assert.throws(
      () => capabilityDraftSchema.parse({ code: "COURSE-001", name: "Cours sur les risques" }),
      /Invalid/
    );
  });

  it("keeps the persisted architecture capability-first", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    assert.ok(schema.includes("model Capability"));
    assert.ok(schema.includes("model CapabilitySkill"));
    assert.ok(!schema.includes("model Course"));
  });

  it("uses the single NOVA Orchestrator in architect mode and validates its output", async () => {
    const orchestrator = new NovaOrchestrator(async ({ mode, output }) => {
      assert.equal(mode, "architect");
      assert.equal(output, "capability");
      return referenceDraft;
    });
    const result = await orchestrator.runArchitect(
      { recentAssessments: [], evidenceAvailable: [], weaknessesOrGaps: [] },
      referenceDraft.sourceIntent
    );
    assert.equal(result.code, "CAP-PROJ-RISK-001");
    assert.ok(result.observableTasks.length > 0);
    assert.ok(result.expectedEvidence.length > 0);
  });

  it("rejects malformed NOVA Architect output before persistence", async () => {
    const orchestrator = new NovaOrchestrator(async () => ({ code: "CAP-INCOMPLETE" }));
    await assert.rejects(
      orchestrator.runArchitect(
        { recentAssessments: [], evidenceAvailable: [], weaknessesOrGaps: [] },
        referenceDraft.sourceIntent
      ),
      /valid capability draft/
    );
  });
});