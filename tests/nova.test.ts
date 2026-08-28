import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NovaOrchestrator } from "../src/server/nova/orchestrator";
import { novaModes } from "../src/server/nova/context-contract";

describe("NOVA Orchestrator", () => {
  it("supports all six specialized modes through one service", async () => {
    const orchestrator = new NovaOrchestrator(async ({ mode }) => ({
      mode,
      message: "A validated response",
      nextAction: "Produce observable evidence",
      confidence: 0.8
    }));
    for (const mode of novaModes) {
      const result = await orchestrator.run(mode, { recentAssessments: [], evidenceAvailable: [], weaknessesOrGaps: [] }, "Test task");
      assert.equal(result.mode, mode);
      assert.ok(result.confidence > 0);
    }
  });

  it("rejects malformed structured provider output", async () => {
    const orchestrator = new NovaOrchestrator(async () => ({ mode: "tutor", message: "", nextAction: "x", confidence: 2 }));
    await assert.rejects(
      orchestrator.run("tutor", { recentAssessments: [], evidenceAvailable: [], weaknessesOrGaps: [] }, "Test task"),
      /valid structured response/
    );
  });
});