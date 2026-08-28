import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MASTERY_LEVELS, PROVENANCE_TYPES, REFERENCE_CAPABILITY } from "../src/domain/mastery";
import { contextContractSchema } from "../src/server/nova/context-contract";

describe("Sprint 0 foundation contracts", () => {
  it("defines five mastery levels and the MP-001 capability", () => {
    assert.equal(MASTERY_LEVELS.length, 5);
    assert.deepEqual(MASTERY_LEVELS.map((level) => level.name), [
      "Awareness", "Assisted Practice", "Autonomous Practice", "Advanced Practice", "System Mastery"
    ]);
    assert.equal(REFERENCE_CAPABILITY.code, "CAP-PROJ-RISK-001");
  });

  it("preserves assessment provenance distinctions", () => {
    assert.deepEqual(PROVENANCE_TYPES, [
      "Self-declared", "AI assessed", "Human validated", "MissionPro verified", "Externally certified"
    ]);
  });

  it("keeps the AI credential out of client code and uses one orchestrator", () => {
    const clientFiles = ["src/app/sign-in/sign-in-form.tsx", "src/app/app/status/nova-smoke-button.tsx"];
    for (const file of clientFiles) assert.ok(!readFileSync(file, "utf8").includes("OPENAI_API_KEY"));
    const architecture = readFileSync("src/server/nova/orchestrator.ts", "utf8");
    assert.ok(architecture.includes("class NovaOrchestrator"));
    assert.ok(architecture.includes("server-only"));
  });

  it("accepts an extensible Context Contract", () => {
    const parsed = contextContractSchema.parse({
      user: { id: "user-1", profile: { locale: "fr" } },
      currentCapability: { code: "CAP-PROJ-RISK-001" },
      observedMasteryLevel: 2,
      targetMasteryLevel: 4,
      recentAssessments: [],
      evidenceAvailable: [],
      weaknessesOrGaps: ["prioritization"]
    });
    assert.equal(parsed.currentCapability?.code, "CAP-PROJ-RISK-001");
  });
});