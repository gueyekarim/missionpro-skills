import "server-only";

import { z } from "zod";
import { db } from "@/lib/db";
import { NovaOrchestrator } from "./nova/orchestrator";
import type { DiagnosticOutput } from "./nova/context-contract";

export const diagnosticResponseSchema = z.object({
  selfAssessment: z.number().int().min(1).max(5),
  knowledgeAnswer: z.string().trim().min(10).max(5000),
  miniCaseAnswer: z.string().trim().min(10).max(5000),
  productionAnswer: z.string().trim().min(10).max(8000)
});

export const diagnosticRequestSchema = z.object({
  capabilityId: z.string().uuid(),
  responses: diagnosticResponseSchema
});

export type DiagnosticResponses = z.infer<typeof diagnosticResponseSchema>;

export const diagnosticMethods = [
  "structured_self_assessment",
  "knowledge_question",
  "mini_case",
  "short_production"
] as const;

export function getDiagnosticInstrument(capability: {
  code: string;
  name: string;
  targetLevel: number | null;
  observableTasks: unknown;
  knowledgeRequirements: unknown;
  evidenceRequirements: unknown;
}) {
  const isMp001 = capability.code === "CAP-PROJ-RISK-001";
  return {
    capability: { code: capability.code, name: capability.name, targetLevel: capability.targetLevel ?? 3 },
    methods: [...diagnosticMethods],
    items: [
      {
        id: "knowledge",
        method: "knowledge_question",
        title: "Question de connaissances",
        prompt: isMp001
          ? "Expliquez comment vous évaluez probabilité, impact et criticité pour qualifier un risque de projet public."
          : `Quelles méthodes et notions mobiliseriez-vous pour ${capability.name.toLowerCase()} ?`,
        criteria: isMp001
          ? ["probabilité", "impact", "criticité", "contexte"]
          : ["méthode", "critère", "contexte"]
      },
      {
        id: "mini-case",
        method: "mini_case",
        title: "Mini-cas professionnel",
        prompt: isMp001
          ? "Un projet public prend du retard et dépend d’un fournisseur critique. Quels risques priorisez-vous, avec quelle réponse et quel responsable ?"
          : `Face à une situation réelle liée à « ${capability.name} », décrivez votre analyse, vos arbitrages et votre action.`,
        criteria: isMp001
          ? ["prioriser", "réponse", "responsable", "matrice"]
          : ["prioriser", "arbitrage", "action"]
      },
      {
        id: "production",
        method: "short_production",
        title: "Production courte",
        prompt: isMp001
          ? "Produisez une mini-matrice de risques : risque, probabilité, impact, priorité, réponse et responsable. Justifiez au moins deux arbitrages."
          : `Produisez un court livrable démontrant que vous pouvez « ${capability.name.toLowerCase()} », puis justifiez vos choix.`,
        criteria: isMp001
          ? ["risque", "probabilité", "impact", "priorité", "réponse", "responsable"]
          : ["production", "critère", "justification"]
      }
    ],
    referenceTasks: Array.isArray(capability.observableTasks)
      ? capability.observableTasks.filter((item): item is string => typeof item === "string")
      : [],
    referenceKnowledge: Array.isArray(capability.knowledgeRequirements)
      ? capability.knowledgeRequirements.filter((item): item is string => typeof item === "string")
      : [],
    expectedEvidence: Array.isArray(capability.evidenceRequirements)
      ? capability.evidenceRequirements.filter((item): item is string => typeof item === "string")
      : []
  };
}

function normalized(value: string) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function scoreAnswer(answer: string, criteria: string[]) {
  const text = normalized(answer);
  const matched = criteria.filter((criterion) => text.includes(normalized(criterion)));
  return { score: matched.length, maxScore: criteria.length, matched };
}

export function calculateDiagnostic(
  capability: Parameters<typeof getDiagnosticInstrument>[0],
  responses: DiagnosticResponses
) {
  const instrument = getDiagnosticInstrument(capability);
  const dimensions = [
    { method: "knowledge_question", answer: responses.knowledgeAnswer, item: instrument.items[0] },
    { method: "mini_case", answer: responses.miniCaseAnswer, item: instrument.items[1] },
    { method: "short_production", answer: responses.productionAnswer, item: instrument.items[2] }
  ];
  const scored = dimensions.map(({ method, answer, item }) => {
    const result = scoreAnswer(answer, item.criteria);
    return {
      dimension: item.title,
      method,
      summary: answer.slice(0, 1000),
      score: result.score,
      maxScore: result.maxScore,
      observedSignals: result.matched
    };
  });
  const total = scored.reduce((sum, item) => sum + item.score, 0);
  const maximum = scored.reduce((sum, item) => sum + item.maxScore, 0);
  const rawLevel = total <= 2 ? 1 : total <= 5 ? 2 : total <= 8 ? 3 : 4;
  const targetLevel = instrument.capability.targetLevel;
  const observedLevel = Math.min(rawLevel, targetLevel);
  const capabilityGap = targetLevel - observedLevel;
  const weakDimensions = scored.filter((item) => item.score < item.maxScore);
  const strengths = scored
    .filter((item) => item.score >= Math.ceil(item.maxScore / 2))
    .map((item) => `${item.dimension} : ${item.observedSignals.join(", ") || "aucun signal explicite"}.`);
  const weaknesses = weakDimensions.map((item) => `${item.dimension} nécessite encore des éléments observables.`);
  const missingEvidence = weakDimensions.length
    ? instrument.expectedEvidence.length
      ? instrument.expectedEvidence
      : ["Production professionnelle rattachée à la capacité et évaluée."]
    : [];
  const recommendedPriorities = weakDimensions.length
    ? weakDimensions.map((item) => `Renforcer ${item.dimension.toLowerCase()} au travers d’une production liée à la capacité.`)
    : ["Passer à une production plus complexe pour confirmer la maîtrise cible."];

  return {
    observedLevel,
    targetLevel,
    capabilityGap,
    strengths: strengths.length ? strengths : ["Une première démonstration a été fournie, mais elle reste à approfondir."],
    weaknesses: weaknesses.length ? weaknesses : ["Aucune faiblesse critique détectée dans cet échantillon court."],
    missingEvidence,
    evidenceSupportingDiagnosis: scored,
    recommendedPriorities,
    confidenceScore: Math.max(0.2, Math.min(1, total / maximum)),
    method: [...diagnosticMethods],
    responses,
    score: total,
    maximum
  };
}

export async function persistDiagnostic(input: unknown, userId: string) {
  const request = diagnosticRequestSchema.parse(input);
  const capability = await db.capability.findUnique({
    where: { id: request.capabilityId },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      targetLevel: true,
      observableTasks: true,
      knowledgeRequirements: true,
      evidenceRequirements: true
    }
  });
  if (!capability) throw new Error("Capability not found");

  const calculated = calculateDiagnostic(capability, request.responses);
  const facts: Omit<DiagnosticOutput, "explanation" | "provenance"> = {
    observedLevel: calculated.observedLevel,
    targetLevel: calculated.targetLevel,
    capabilityGap: calculated.capabilityGap,
    strengths: calculated.strengths,
    weaknesses: calculated.weaknesses,
    missingEvidence: calculated.missingEvidence,
    evidenceSupportingDiagnosis: calculated.evidenceSupportingDiagnosis,
    recommendedPriorities: calculated.recommendedPriorities,
    confidenceScore: calculated.confidenceScore
  };
  const result = await new NovaOrchestrator().runDiagnostician(
    {
      user: { id: userId },
      roleContext: "Diagnostic Engine",
      currentCapability: { id: capability.id, code: capability.code, name: capability.name, description: capability.description },
      targetMasteryLevel: calculated.targetLevel,
      currentTask: JSON.stringify(facts),
      recentAssessments: [],
      evidenceAvailable: [],
      weaknessesOrGaps: calculated.weaknesses
    },
    JSON.stringify(facts)
  );
  if (
    result.observedLevel !== calculated.observedLevel ||
    result.targetLevel !== calculated.targetLevel ||
    result.capabilityGap !== calculated.capabilityGap ||
    result.targetLevel - result.observedLevel !== result.capabilityGap
  ) {
    throw new Error("Diagnostic invariant violation");
  }

  const session = await db.$transaction(async (tx) => {
    const created = await tx.diagnosticSession.create({
      data: {
        userId,
        capabilityId: capability.id,
        method: calculated.method,
        responses: calculated.responses,
        observedLevel: result.observedLevel,
        targetLevel: result.targetLevel,
        capabilityGap: result.capabilityGap,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        missingEvidence: result.missingEvidence,
        evidenceSupportingDiagnosis: result.evidenceSupportingDiagnosis,
        explanation: result.explanation,
        recommendedPriorities: result.recommendedPriorities,
        provenance: result.provenance,
        confidenceScore: result.confidenceScore,
        completedAt: new Date()
      }
    });
    await tx.userCapability.upsert({
      where: { userId_capabilityId: { userId, capabilityId: capability.id } },
      update: {
        observedLevel: result.observedLevel,
        targetLevel: result.targetLevel,
        confidenceScore: result.confidenceScore,
        lastAssessedAt: new Date()
      },
      create: {
        userId,
        capabilityId: capability.id,
        observedLevel: result.observedLevel,
        targetLevel: result.targetLevel,
        confidenceScore: result.confidenceScore,
        evidenceCount: 0,
        lastAssessedAt: new Date()
      }
    });
    return created;
  });

  return { session, capability, result };
}

export function serializeDiagnostic(session: {
  id: string;
  capabilityId: string;
  status: string;
  method: unknown;
  responses: unknown;
  observedLevel: number;
  targetLevel: number;
  capabilityGap: number;
  strengths: unknown;
  weaknesses: unknown;
  missingEvidence: unknown;
  evidenceSupportingDiagnosis: unknown;
  explanation: string;
  recommendedPriorities: unknown;
  provenance: string;
  confidenceScore: unknown;
  createdAt: Date;
  completedAt: Date | null;
}) {
  return { ...session, createdAt: session.createdAt.toISOString(), completedAt: session.completedAt?.toISOString() ?? null };
}