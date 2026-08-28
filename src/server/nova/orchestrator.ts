import "server-only";

import { getServerConfig } from "@/lib/config";
import {
  contextContractSchema,
  novaModes,
  capabilityDraftSchema,
  diagnosticOutputSchema,
  novaSmokeOutputSchema,
  type ContextContract,
  type CapabilityDraft,
  type DiagnosticOutput,
  type NovaMode,
  type NovaSmokeOutput
} from "./context-contract";
import { buildSystemPrompt } from "./prompts";
import { REFERENCE_CAPABILITY } from "@/domain/mastery";

type NovaProvider = (input: {
  mode: NovaMode;
  context: ContextContract;
  task: string;
  output: "smoke" | "capability" | "diagnostic";
}) => Promise<unknown>;

const mockProvider: NovaProvider = async ({ mode, context, task, output }) => {
  if (output === "capability") {
    const isReference = /risques?.*projet public|projet public.*risques?/i.test(task);
    if (isReference) {
      return {
        code: REFERENCE_CAPABILITY.code,
        sourceIntent: task,
        name: REFERENCE_CAPABILITY.name,
        description: REFERENCE_CAPABILITY.description,
        domain: REFERENCE_CAPABILITY.domain,
        purpose: REFERENCE_CAPABILITY.purpose,
        businessOutcome: REFERENCE_CAPABILITY.businessOutcome,
        outcomes: [
          "Décider quelles menaces nécessitent une action de pilotage.",
          "Sécuriser l’atteinte des résultats du projet public."
        ],
        skills: [
          {
            code: "SKILL-RISK-CONTEXT",
            name: "Analyser le contexte du projet",
            description: "Repérer les facteurs internes et externes qui influencent le risque.",
            category: "analysis",
            skillType: "professional",
            requiredLevel: 3
          },
          {
            code: "SKILL-RISK-QUALIFICATION",
            name: "Qualifier probabilité et impact",
            description: "Évaluer la probabilité, l’impact et la criticité d’un risque.",
            category: "analysis",
            skillType: "professional",
            requiredLevel: 3
          },
          {
            code: "SKILL-RISK-PRIORITIZATION",
            name: "Prioriser et justifier les réponses",
            description: "Classer les risques et recommander une réponse argumentée.",
            category: "decision",
            skillType: "professional",
            requiredLevel: 4
          }
        ],
        knowledgeRequirements: [
          "Cycle de vie et gouvernance d’un projet public.",
          "Probabilité, impact, criticité et stratégies de réponse."
        ],
        observableTasks: [
          "Construire une matrice de risques contextualisée.",
          "Justifier la priorité et le responsable de chaque risque.",
          "Proposer une réponse proportionnée à la criticité."
        ],
        targetLevel: REFERENCE_CAPABILITY.targetLevel,
        successCriteria: [...REFERENCE_CAPABILITY.successCriteria],
        expectedEvidence: [...REFERENCE_CAPABILITY.evidenceRequirements]
      };
    }

    const normalized = task.trim().replace(/^je veux être capable de\s*/i, "").replace(/^être capable de\s*/i, "");
    const slug = normalized.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 35) || "NEW-CAPABILITY";
    return {
      code: `CAP-${slug}`,
      sourceIntent: task,
      name: normalized.charAt(0).toUpperCase() + normalized.slice(1),
      description: `Réaliser de manière autonome : ${normalized}.`,
      domain: "Compétences professionnelles",
      purpose: `Transformer l’intention « ${normalized} » en résultat observable.`,
      businessOutcome: "Produire un résultat professionnel fiable et explicable.",
      outcomes: [`Réaliser : ${normalized}.`],
      skills: [
        {
          code: `SKILL-${slug}-ANALYZE`,
          name: "Analyser la situation",
          description: "Analyser le contexte avant d’agir.",
          category: "analysis",
          skillType: "professional",
          requiredLevel: 3
        },
        {
          code: `SKILL-${slug}-DELIVER`,
          name: "Produire un résultat exploitable",
          description: "Réaliser et expliquer un livrable observable.",
          category: "delivery",
          skillType: "professional",
          requiredLevel: 3
        }
      ],
      knowledgeRequirements: ["Concepts, méthodes et vocabulaire du domaine concerné."],
      observableTasks: [`Réaliser une production observable liée à « ${normalized} ».`],
      targetLevel: 3,
      successCriteria: ["Le résultat répond au besoin et peut être expliqué."],
      expectedEvidence: ["Livrable professionnel accompagné de sa justification."]
    };
  }

  if (output === "diagnostic") {
    const facts = JSON.parse(task) as Omit<DiagnosticOutput, "explanation" | "provenance">;
    return {
      ...facts,
      explanation: `Le niveau observé est ${facts.observedLevel}/5 contre une cible de ${facts.targetLevel}/5. Le gap de ${facts.capabilityGap} niveau(x) correspond à la différence entre la capacité cible et les éléments démontrés dans les activités observables.`,
      provenance: "AI assessed"
    };
  }

  return {
    mode,
    message: `Smoke response for ${mode}: ${task || "continue with an observable capability practice."}`,
    nextAction:
      context.recommendedNextAction ??
      "Relier la prochaine action à une production observable et à une preuve évaluable.",
    confidence: 0.92
  };
};

const capabilityDraftJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    code: { type: "string" },
    sourceIntent: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    domain: { type: "string" },
    purpose: { type: "string" },
    businessOutcome: { type: "string" },
    outcomes: { type: "array", items: { type: "string" } },
    skills: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          code: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          skillType: { type: "string" },
          requiredLevel: { type: "integer", minimum: 1, maximum: 5 }
        },
        required: ["code", "name", "description", "category", "skillType", "requiredLevel"]
      }
    },
    knowledgeRequirements: { type: "array", items: { type: "string" } },
    observableTasks: { type: "array", items: { type: "string" } },
    targetLevel: { type: "integer", minimum: 1, maximum: 5 },
    successCriteria: { type: "array", items: { type: "string" } },
    expectedEvidence: { type: "array", items: { type: "string" } }
  },
  required: [
    "code", "sourceIntent", "name", "description", "domain", "purpose", "businessOutcome", "outcomes",
    "skills", "knowledgeRequirements", "observableTasks", "targetLevel", "successCriteria", "expectedEvidence"
  ]
};

const diagnosticJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    observedLevel: { type: "integer", minimum: 1, maximum: 5 },
    targetLevel: { type: "integer", minimum: 1, maximum: 5 },
    capabilityGap: { type: "integer", minimum: 0, maximum: 4 },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    missingEvidence: { type: "array", items: { type: "string" } },
    evidenceSupportingDiagnosis: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          dimension: { type: "string" },
          method: { type: "string" },
          summary: { type: "string" },
          score: { type: "integer", minimum: 0, maximum: 10 },
          maxScore: { type: "integer", minimum: 1, maximum: 10 },
          observedSignals: { type: "array", items: { type: "string" } }
        },
        required: ["dimension", "method", "summary", "score", "maxScore", "observedSignals"]
      }
    },
    explanation: { type: "string" },
    recommendedPriorities: { type: "array", items: { type: "string" } },
    provenance: { type: "string", enum: ["AI assessed"] },
    confidenceScore: { type: "number", minimum: 0, maximum: 1 }
  },
  required: [
    "observedLevel", "targetLevel", "capabilityGap", "strengths", "weaknesses",
    "missingEvidence", "evidenceSupportingDiagnosis", "explanation",
    "recommendedPriorities", "provenance", "confidenceScore"
  ]
};

async function openAiProvider({ mode, context, task, output }: Parameters<NovaProvider>[0]): Promise<unknown> {
  const config = getServerConfig();
  const isCapability = output === "capability";
  const isDiagnostic = output === "diagnostic";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: config.AI_MODEL,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: isCapability ? "nova_capability_draft" : isDiagnostic ? "nova_diagnostic_output" : "nova_smoke_output",
          strict: true,
          schema: isCapability ? capabilityDraftJsonSchema : isDiagnostic ? diagnosticJsonSchema : {
            type: "object",
            additionalProperties: false,
            properties: {
              mode: { type: "string", enum: [...novaModes] },
              message: { type: "string" },
              nextAction: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 }
            },
            required: ["mode", "message", "nextAction", "confidence"]
          }
        }
      },
      messages: [
        { role: "system", content: buildSystemPrompt(mode) },
        { role: "user", content: JSON.stringify({ task, context }) }
      ]
    })
  });
  if (!response.ok) throw new Error(`NOVA provider error (${response.status})`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("NOVA provider returned no structured content");
  return JSON.parse(content);
}

export class NovaOrchestrator {
  private readonly provider: NovaProvider;

  constructor(provider?: NovaProvider) {
    if (provider) {
      this.provider = provider;
      return;
    }
    const config = getServerConfig();
    this.provider = config.AI_PROVIDER === "openai" ? openAiProvider : mockProvider;
  }

  async run(mode: NovaMode, context: ContextContract, task: string): Promise<NovaSmokeOutput> {
    const parsedMode = novaModes.find((candidate) => candidate === mode);
    if (!parsedMode) throw new Error(`Unsupported NOVA mode: ${mode}`);
    const parsedContext = contextContractSchema.parse(context);
    try {
      const raw = await this.provider({ mode: parsedMode, context: parsedContext, task, output: "smoke" });
      return novaSmokeOutputSchema.parse(raw);
    } catch (error) {
      console.error("[nova] orchestrator failure", error instanceof Error ? error.message : "unknown error");
      throw new Error("NOVA could not produce a valid structured response");
    }
  }

  async runArchitect(context: ContextContract, task: string): Promise<CapabilityDraft> {
    const parsedContext = contextContractSchema.parse(context);
    try {
      const raw = await this.provider({ mode: "architect", context: parsedContext, task, output: "capability" });
      return capabilityDraftSchema.parse(raw);
    } catch (error) {
      console.error("[nova] architect failure", error instanceof Error ? error.message : "unknown error");
      throw new Error("NOVA Architect could not produce a valid capability draft");
    }
  }

  async runDiagnostician(context: ContextContract, task: string): Promise<DiagnosticOutput> {
    const parsedContext = contextContractSchema.parse(context);
    try {
      const raw = await this.provider({ mode: "diagnostician", context: parsedContext, task, output: "diagnostic" });
      return diagnosticOutputSchema.parse(raw);
    } catch (error) {
      console.error("[nova] diagnostician failure", error instanceof Error ? error.message : "unknown error");
      throw new Error("NOVA Diagnostician could not produce a valid diagnostic");
    }
  }
}

export { mockProvider };