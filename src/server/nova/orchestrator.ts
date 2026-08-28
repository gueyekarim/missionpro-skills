import "server-only";

import { getServerConfig } from "@/lib/config";
import {
  contextContractSchema,
  novaModes,
  capabilityDraftSchema,
  diagnosticOutputSchema,
  personalPathOutputSchema,
  tutorOutputSchema,
  assessorOutputSchema,
  novaSmokeOutputSchema,
  type ContextContract,
  type CapabilityDraft,
  type DiagnosticOutput,
  type PersonalPathOutput,
  type TutorOutput,
  type AssessorOutput,
  type NovaMode,
  type NovaSmokeOutput
} from "./context-contract";
import { buildSystemPrompt } from "./prompts";
import { REFERENCE_CAPABILITY } from "@/domain/mastery";

type NovaProvider = (input: {
  mode: NovaMode;
  context: ContextContract;
  task: string;
  output: "smoke" | "capability" | "diagnostic" | "path" | "tutor" | "assessor";
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

  if (output === "path") {
    const facts = JSON.parse(task) as Omit<PersonalPathOutput, "provenance">;
    return { ...facts, provenance: "AI assisted" };
  }

  if (output === "tutor") {
    const input = JSON.parse(task) as { mode: string; question: string };
    const observed = context.observedMasteryLevel ?? 1;
    const target = context.targetMasteryLevel ?? 3;
    const stage = String(context.currentPathItem?.stage ?? "learn");
    const advanced = observed >= target || observed >= 3;
    const focus = advanced
      ? "l’arbitrage et la justification d’une réponse proportionnée"
      : "le repérage du contexte, de la probabilité et de l’impact";
    return {
      mode: input.mode,
      response: input.mode === "MY WORK"
        ? `Pour votre travail, partez de la situation réelle décrite et ${focus}. Ne cherchez pas une liste générique : reliez chaque décision à un risque, un critère et un responsable.`
        : input.mode === "ASK NOVA"
          ? `Votre question est traitée au niveau ${observed}/5, dans l’étape ${stage}. Commencez par isoler les faits observables, puis utilisez ${focus}.`
          : `À votre niveau ${observed}/5, travaillez ${focus}. La cible est ${target}/5 : l’objectif n’est pas de relire ce qui est déjà démontré, mais de produire un choix explicable dans votre contexte.`,
      teachingPoint: `Point clé pour cette étape : ${focus}.`,
      questionForLearner: `Quel élément de votre contexte justifie le choix que vous feriez ici ?`,
      examples: advanced
        ? ["Un risque fournisseur devient prioritaire lorsque son impact sur le chemin critique est explicité et relié à une réponse."]
        : ["Un retard fournisseur est d’abord relié au contexte, puis qualifié par probabilité et impact avant toute réponse."],
      reasoningSteps: [
        "Nommer le contexte et le résultat menacé.",
        "Qualifier le signal avec un critère explicite.",
        "Choisir une réponse et nommer le responsable."
      ],
      feedback: `La réponse doit être reliée à l’étape ${stage} et à la Capability, pas à une notion isolée.`,
      professionalConnection: `Appliquez ce raisonnement à une décision réelle de votre projet public : ${input.question.slice(0, 220)}.`,
      suggestedExercise: advanced
        ? "Prenez un risque ambigu et défendez deux priorisations possibles avant de choisir."
        : "Construisez une mini-fiche avec contexte, probabilité, impact et première réponse.",
      nextAction: "Produire la trace attendue pour l’étape actuelle, puis la comparer à sa condition de complétion.",
      provenance: "AI assisted"
    };
  }

  if (output === "assessor") {
    const input = JSON.parse(task) as {
      production: string;
      activity: { title: string; assessmentCriteria: Array<{ code: string; label: string; maxScore: number; weight: number }> };
    };
    const normalized = input.production.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const terms: Record<string, string[]> = {
      risk_identification: ["risque", "menace", "evenement"],
      probability_impact: ["probabilite", "impact", "criticite"],
      prioritization: ["priorit", "priorite", "classe", "score", "urgent"],
      treatment_strategy: ["reponse", "traitement", "attenu", "responsable", "action"],
      reasoning: ["justif", "raison", "car", "arbitr", "compar"],
      professional_output: ["matrice", "tableau", "livrable", "responsable", "risque"]
    };
    const criterionScores = input.activity.assessmentCriteria.map((criterion) => {
      const matches = (terms[criterion.code] ?? [criterion.code]).filter((term) => normalized.includes(term));
      const ratio = matches.length / Math.max(1, (terms[criterion.code] ?? [criterion.code]).length);
      const score = matches.length === 0 ? 0 : ratio >= 0.66 ? 5 : ratio >= 0.33 ? 3 : 2;
      return {
        ...criterion,
        score,
        rationale: score >= 4
          ? `La production traite explicitement ${criterion.label.toLocaleLowerCase()}.`
          : score > 0
            ? `Un signal existe pour ${criterion.label.toLocaleLowerCase()}, mais il doit être rendu plus explicite.`
            : `La production ne permet pas encore de vérifier ${criterion.label.toLocaleLowerCase()}.`
      };
    });
    const totalWeight = criterionScores.reduce((sum, item) => sum + item.weight, 0) || 1;
    const overallScore = Math.round(criterionScores.reduce((sum, item) => sum + (item.score / item.maxScore) * item.weight, 0) / totalWeight * 100);
    const strengths = criterionScores.filter((item) => item.score >= 4).map((item) => item.label);
    const weaknesses = criterionScores.filter((item) => item.score > 0 && item.score < 4).map((item) => item.label);
    const missingElements = criterionScores.filter((item) => item.score === 0).map((item) => item.label);
    const strong = overallScore >= 75;
    return {
      overallScore,
      criterionScores,
      strengths,
      weaknesses,
      missingElements,
      explanation: `La production a été comparée à la situation professionnelle et aux ${criterionScores.length} critères de la rubric de « ${input.activity.title} ».`,
      feedback: strong
        ? "Le raisonnement est exploitable. Renforcez la défense des arbitrages et la traçabilité de chaque action."
        : "La production doit expliciter les risques, leurs probabilités et impacts, puis relier chaque priorité à un traitement et à un responsable.",
      recommendedNextAction: strong
        ? "Refaire le challenge avec un risque ambigu et défendre deux arbitrages avant de choisir."
        : "Reprendre la matrice sur deux risques en ajoutant probabilité, impact, priorité, traitement et responsable.",
      masteryRecommendation: strong
        ? "Peut soutenir une revue humaine du niveau cible ; ne constitue pas une certification."
        : "Ne recommande pas encore le niveau cible ; une activité de remédiation est indiquée.",
      provenance: "AI assessed",
      limitations: ["Analyse fondée sur la production fournie et la rubric ; une validation humaine reste distincte."]
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

const personalPathJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    capabilityCode: { type: "string" },
    observedLevel: { type: "integer", minimum: 1, maximum: 5 },
    targetLevel: { type: "integer", minimum: 1, maximum: 5 },
    capabilityGap: { type: "integer", minimum: 0, maximum: 4 },
    summary: { type: "string" },
    items: {
      type: "array",
      minItems: 1,
      maxItems: 30,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          sequence: { type: "integer", minimum: 1, maximum: 30 },
          stage: { type: "string", enum: ["understand", "learn", "practice", "challenge", "apply", "prove", "master"] },
          capabilityCode: { type: "string" },
          skillCode: { type: ["string", "null"] },
          title: { type: "string" },
          objective: { type: "string" },
          activity: { type: "string" },
          expectedOutput: { type: "string" },
          completionCondition: { type: "string" },
          gapRationale: { type: "string" },
          targetLevel: { type: "integer", minimum: 1, maximum: 5 }
        },
        required: ["sequence", "stage", "capabilityCode", "skillCode", "title", "objective", "activity", "expectedOutput", "completionCondition", "gapRationale", "targetLevel"]
      }
    },
    provenance: { type: "string", enum: ["AI assisted"] }
  },
  required: ["capabilityCode", "observedLevel", "targetLevel", "capabilityGap", "summary", "items", "provenance"]
};

const tutorJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    mode: { type: "string", enum: ["LEARN", "ASK NOVA", "MY WORK"] },
    response: { type: "string" },
    teachingPoint: { type: "string" },
    questionForLearner: { type: "string" },
    examples: { type: "array", items: { type: "string" } },
    reasoningSteps: { type: "array", items: { type: "string" } },
    feedback: { type: "string" },
    professionalConnection: { type: "string" },
    suggestedExercise: { type: "string" },
    nextAction: { type: "string" },
    provenance: { type: "string", enum: ["AI assisted"] }
  },
  required: ["mode", "response", "teachingPoint", "questionForLearner", "examples", "reasoningSteps", "feedback", "professionalConnection", "suggestedExercise", "nextAction", "provenance"]
};

const assessorJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overallScore: { type: "integer", minimum: 0, maximum: 100 },
    criterionScores: { type: "array", items: { type: "object", additionalProperties: false, properties: {
      code: { type: "string" }, label: { type: "string" }, maxScore: { type: "integer" }, weight: { type: "number" },
      score: { type: "integer" }, rationale: { type: "string" }
    }, required: ["code", "label", "maxScore", "weight", "score", "rationale"] } },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    missingElements: { type: "array", items: { type: "string" } },
    explanation: { type: "string" },
    feedback: { type: "string" },
    recommendedNextAction: { type: "string" },
    masteryRecommendation: { type: "string" },
    provenance: { type: "string", enum: ["AI assessed"] },
    limitations: { type: "array", items: { type: "string" } }
  },
  required: ["overallScore", "criterionScores", "strengths", "weaknesses", "missingElements", "explanation", "feedback", "recommendedNextAction", "masteryRecommendation", "provenance", "limitations"]
};

async function openAiProvider({ mode, context, task, output }: Parameters<NovaProvider>[0]): Promise<unknown> {
  const config = getServerConfig();
  const isCapability = output === "capability";
   const isDiagnostic = output === "diagnostic";
  const isPath = output === "path";
  const isTutor = output === "tutor";
  const isAssessor = output === "assessor";
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
           name: isCapability ? "nova_capability_draft" : isDiagnostic ? "nova_diagnostic_output" : isPath ? "nova_personal_capability_path" : isTutor ? "nova_tutor_response" : isAssessor ? "nova_assessment_result" : "nova_smoke_output",
          strict: true,
           schema: isCapability ? capabilityDraftJsonSchema : isDiagnostic ? diagnosticJsonSchema : isPath ? personalPathJsonSchema : isTutor ? tutorJsonSchema : isAssessor ? assessorJsonSchema : {
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

  async runPath(context: ContextContract, task: string): Promise<PersonalPathOutput> {
    const parsedContext = contextContractSchema.parse(context);
    try {
      const raw = await this.provider({ mode: "mentor", context: parsedContext, task, output: "path" });
      return personalPathOutputSchema.parse(raw);
    } catch (error) {
      console.error("[nova] path generation failure", error instanceof Error ? error.message : "unknown error");
      throw new Error("NOVA Mentor could not produce a valid personal capability path");
    }
  }

  async runTutor(context: ContextContract, task: string): Promise<TutorOutput> {
    const parsedContext = contextContractSchema.parse(context);
    try {
      const raw = await this.provider({ mode: "tutor", context: parsedContext, task, output: "tutor" });
      return tutorOutputSchema.parse(raw);
    } catch (error) {
      console.error("[nova] tutor failure", error instanceof Error ? error.message : "unknown error");
      throw new Error("NOVA Tutor could not produce a valid contextual response");
    }
  }

  async runAssessor(context: ContextContract, task: string): Promise<AssessorOutput> {
    const parsedContext = contextContractSchema.parse(context);
    try {
      const raw = await this.provider({ mode: "assessor", context: parsedContext, task, output: "assessor" });
      return assessorOutputSchema.parse(raw);
    } catch (error) {
      console.error("[nova] assessor failure", error instanceof Error ? error.message : "unknown error");
      throw new Error("NOVA Assessor could not produce a valid structured assessment");
    }
  }
}

export { mockProvider };