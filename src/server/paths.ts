import "server-only";

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { NovaOrchestrator } from "./nova/orchestrator";
import {
  personalPathOutputSchema,
  pathStages,
  type PathStage,
  type PersonalPathItem,
  type PersonalPathOutput
} from "./nova/context-contract";

export const pathRequestSchema = z.object({
  capabilityId: z.string().uuid(),
  diagnosticId: z.string().uuid().optional()
});

export const pathProgressSchema = z.object({
  itemId: z.string().uuid(),
  status: z.enum(["not_started", "in_progress", "completed"])
});

type PathCapability = Prisma.CapabilityGetPayload<{
  include: {
    skills: { include: { skill: true } };
    learningUnits: { include: { learningUnit: true } };
  };
}>;

type PathDiagnostic = Prisma.DiagnosticSessionGetPayload<{
  select: {
    id: true;
    observedLevel: true;
    targetLevel: true;
    capabilityGap: true;
    weaknesses: true;
    missingEvidence: true;
    evidenceSupportingDiagnosis: true;
    recommendedPriorities: true;
  };
}>;

function strings(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function records(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value)
    ? value.filter((item): item is Prisma.JsonObject => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];
}

export function buildPersonalPathDraft(capability: PathCapability, diagnostic: PathDiagnostic): PersonalPathOutput {
  const observedLevel = diagnostic.observedLevel;
  const targetLevel = diagnostic.targetLevel;
  const capabilityGap = diagnostic.capabilityGap;
  const weaknesses = strings(diagnostic.weaknesses);
  const missingEvidence = strings(diagnostic.missingEvidence);
  const weakEvidenceDimensions = records(diagnostic.evidenceSupportingDiagnosis)
    .filter((item) => typeof item.score === "number" && typeof item.maxScore === "number" && item.score < item.maxScore)
    .map((item) => typeof item.dimension === "string" ? item.dimension : "")
    .filter(Boolean);
  const diagnosedNeed = [
    ...weaknesses,
    weakEvidenceDimensions.length ? `Dimensions sous le maximum : ${weakEvidenceDimensions.join(", ")}.` : "",
    ...missingEvidence
  ].filter(Boolean).join(" ").slice(0, 450) || `Écart de ${capabilityGap} niveau(x) à traiter.`;
  const allSkills = capability.skills.map(({ skill, requiredLevel }) => ({
    code: skill.code,
    name: skill.name,
    description: skill.description ?? "Compétence associée à la Capability.",
    requiredLevel: requiredLevel ?? targetLevel
  }));
  const prioritySkill = allSkills.find((skill) => /prior|decis|réponse|response/i.test(`${skill.name} ${skill.description}`))
    ?? allSkills[allSkills.length - 1];
  const focusSkills = observedLevel <= 2 ? allSkills : prioritySkill ? [prioritySkill] : allSkills;
  const primaryTask = strings(capability.observableTasks)[0] ?? `Réaliser une production liée à « ${capability.name} ».`;
  const expectedEvidence = strings(capability.evidenceRequirements);
  const items: PersonalPathItem[] = [];

  function add(
    stage: PathStage,
    title: string,
    objective: string,
    activity: string,
    expectedOutput: string,
    completionCondition: string,
    gapRationale: string,
    skillCode?: string
  ) {
    items.push({
      sequence: items.length + 1,
      stage,
      capabilityCode: capability.code,
      skillCode: skillCode ?? null,
      title,
      objective,
      activity,
      expectedOutput,
      completionCondition,
      gapRationale,
      targetLevel
    });
  }

  if (capabilityGap > 0 && observedLevel <= 2) {
    const knowledgeNeed = strings(capability.knowledgeRequirements)[0] ?? "les notions nécessaires à la Capability";
    add(
      "understand",
      `Comprendre le besoin : ${capability.name}`,
      `Relier ${knowledgeNeed.toLowerCase()} aux situations où la Capability doit être exercée.`,
      `Analyser une situation de projet liée à la Capability et annoter les signaux qui manquent aujourd’hui : ${weaknesses.join(" ") || "critères encore à démontrer"}.`,
      "Une fiche de repérage des concepts et signaux utiles.",
      "La fiche relie au moins trois signaux de contexte à une décision possible.",
      "Le diagnostic montre un besoin de fondations avant la pratique autonome."
    );
  }

  if (capabilityGap > 0) {
    for (const skill of focusSkills) {
      add(
        "learn",
        `Développer : ${skill.name}`,
        `Mobiliser ${skill.name.toLowerCase()} au niveau requis ${Math.min(targetLevel, skill.requiredLevel)}/5.`,
        `Étudier la méthode associée à « ${skill.name} », puis l’appliquer à ${primaryTask.toLowerCase()}.`,
        `Une note de méthode annotée pour ${skill.name}.`,
        "La méthode est expliquée et reliée à un choix concret dans le contexte.",
      `Besoin diagnostiqué : ${diagnosedNeed}`,
        skill.code
      );
      add(
        "practice",
        `Pratiquer : ${skill.name}`,
        `Réaliser une première production guidée mobilisant ${skill.name.toLowerCase()}.`,
        `Reprendre un cas de projet public et produire un livrable court ; comparer le résultat aux critères de la Capability et corriger une faiblesse.`,
        "Une production guidée avec corrections explicites.",
        "La production couvre les critères annoncés et les corrections sont justifiées.",
        `Les signaux observés restent insuffisants pour la cible. ${diagnosedNeed}`,
        skill.code
      );
    }

    if (targetLevel >= 4) {
      add(
        "challenge",
        "Simuler une situation complexe",
        `Arbitrer dans une situation non routinière au niveau ${targetLevel}/5.`,
        `Traiter un mini-cas avec contraintes, parties prenantes et informations incomplètes ; défendre les arbitrages devant un pair.`,
        "Une décision argumentée face au mini-cas.",
        "Les arbitrages, risques résiduels et compromis sont explicités.",
        "Le niveau cible demande de traiter la complexité, au-delà d’une application guidée."
      );
    }

    add(
      "apply",
      "Appliquer au travail réel",
      `Transférer la Capability à une situation réelle de projet.`,
      `Réaliser la tâche observable « ${primaryTask} » sur un projet réel ou un cas suffisamment contextualisé.`,
      "Un livrable contextualisé accompagné de ses choix.",
      "Le livrable est exploitable, contextualisé et défendable auprès des parties prenantes.",
      `L’application réelle est nécessaire pour transformer la pratique en preuve de progression.`
    );
  }

  add(
    "prove",
    "Préparer la preuve de compétence",
    `Produire une preuve alignée sur la cible ${targetLevel}/5.`,
    `Constituer la preuve attendue : ${expectedEvidence.join(" ; ") || "un livrable professionnel évalué"}.`,
    expectedEvidence[0] ?? "Un livrable professionnel évalué contre des critères explicites.",
    "Une évaluation explicite confirme que les critères et le niveau cible sont atteints.",
    capabilityGap > 0
      ? `La preuve manquante est la condition de sortie du gap : ${missingEvidence.join(" ") || "production évaluée"}.`
      : "Le diagnostic est déjà à la cible ; cette étape valide la maîtrise par une preuve."
  );
  add(
    "master",
    "Confirmer la maîtrise",
    `Faire confirmer le niveau ${targetLevel}/5 par une évaluation explicite.`,
    "Soumettre la preuve à l’évaluation prévue et relire les feedbacks avec le contexte de la Capability.",
    "Une recommandation de niveau appuyée par une preuve et une évaluation.",
    "La maîtrise ne découle pas de la complétion du parcours ; elle dépend d’une évaluation et de preuves.",
    "L’évaluation confirme le niveau cible ou ouvre un nouveau cycle de développement."
  );

  return {
    capabilityCode: capability.code,
    observedLevel,
    targetLevel,
    capabilityGap,
    summary: capabilityGap > 0
      ? `Parcours personnel en ${items.length} étapes pour passer du niveau ${observedLevel} au niveau ${targetLevel}, centré sur ${focusSkills.map((skill) => skill.name).join(", ")}.`
      : `Le niveau cible ${targetLevel} est déjà observé : le parcours se limite à la preuve et à la confirmation de maîtrise.`,
    items,
    provenance: "AI assisted"
  };
}

function validatePathAgainstSource(path: PersonalPathOutput, capability: PathCapability, diagnostic: PathDiagnostic) {
  if (
    path.capabilityCode !== capability.code ||
    path.observedLevel !== diagnostic.observedLevel ||
    path.targetLevel !== diagnostic.targetLevel ||
    path.capabilityGap !== diagnostic.capabilityGap ||
    path.targetLevel - path.observedLevel !== path.capabilityGap
  ) {
    throw new Error("Personal path source or gap invariant violation");
  }
  const skillCodes = new Set(capability.skills.map(({ skill }) => skill.code));
  const seenSequences = new Set<number>();
  for (const item of path.items) {
    if (item.capabilityCode !== capability.code) throw new Error("Personal path item is not linked to its Capability");
    if (seenSequences.has(item.sequence)) throw new Error("Personal path item sequence must be unique");
    seenSequences.add(item.sequence);
    if (item.skillCode && !skillCodes.has(item.skillCode)) throw new Error("Personal path item references an unknown skill");
    if (item.targetLevel !== diagnostic.targetLevel) throw new Error("Personal path item target mismatch");
  }
  if (path.items.some((item) => !pathStages.includes(item.stage))) throw new Error("Personal path contains an invalid stage");
}

export async function persistPersonalPath(input: unknown, userId: string) {
  const request = pathRequestSchema.parse(input);
  const capability = await db.capability.findUnique({
    where: { id: request.capabilityId },
    include: {
      skills: { include: { skill: true } },
      learningUnits: { include: { learningUnit: true } }
    }
  });
  if (!capability) throw new Error("Capability not found");

  const diagnosticSelect = {
    id: true, observedLevel: true, targetLevel: true, capabilityGap: true,
    weaknesses: true, missingEvidence: true, evidenceSupportingDiagnosis: true, recommendedPriorities: true
  } as const;
  const diagnostic = request.diagnosticId
    ? await db.diagnosticSession.findFirst({
        where: { id: request.diagnosticId, userId, capabilityId: capability.id },
        select: diagnosticSelect
      })
    : await db.diagnosticSession.findFirst({
        where: { userId, capabilityId: capability.id },
        orderBy: { createdAt: "desc" },
        select: diagnosticSelect
      });
  if (!diagnostic) throw new Error("Complete a diagnostic before generating a personal path");

  const draft = buildPersonalPathDraft(capability, diagnostic);
  const path = await new NovaOrchestrator().runPath(
    {
      user: { id: userId },
      roleContext: "Personal Capability Path",
      currentCapability: { id: capability.id, code: capability.code, name: capability.name, description: capability.description },
      observedMasteryLevel: diagnostic.observedLevel,
      targetMasteryLevel: diagnostic.targetLevel,
      recentAssessments: [],
      evidenceAvailable: [{ diagnosticEvidence: diagnostic.evidenceSupportingDiagnosis }],
      weaknessesOrGaps: [...strings(diagnostic.weaknesses), ...strings(diagnostic.recommendedPriorities)],
      currentTask: JSON.stringify({
        capability: { code: capability.code, name: capability.name, knowledgeRequirements: capability.knowledgeRequirements, observableTasks: capability.observableTasks, evidenceRequirements: capability.evidenceRequirements },
        skills: capability.skills.map(({ skill, requiredLevel }) => ({ code: skill.code, name: skill.name, description: skill.description, requiredLevel })),
        diagnostic: { observedLevel: diagnostic.observedLevel, targetLevel: diagnostic.targetLevel, capabilityGap: diagnostic.capabilityGap, weaknesses: diagnostic.weaknesses, evidence: diagnostic.evidenceSupportingDiagnosis }
      })
    },
    JSON.stringify(draft)
  );
  validatePathAgainstSource(path, capability, diagnostic);

  const learningUnit = capability.learningUnits.find(({ learningUnit }) => learningUnit.type === "foundation")?.learningUnit
    ?? capability.learningUnits[0]?.learningUnit;
  const saved = await db.$transaction(async (tx) => {
    const created = await tx.personalCapabilityPath.create({
      data: {
        userId,
        capabilityId: capability.id,
        diagnosticSessionId: diagnostic.id,
        observedLevel: path.observedLevel,
        targetLevel: path.targetLevel,
        capabilityGap: path.capabilityGap,
        weaknessesSnapshot: strings(diagnostic.weaknesses),
        evidenceSnapshot: JSON.parse(JSON.stringify(diagnostic.evidenceSupportingDiagnosis ?? [])) as Prisma.InputJsonValue,
        skillsSnapshot: capability.skills.map(({ skill, requiredLevel }) => ({ code: skill.code, name: skill.name, requiredLevel })),
        summary: path.summary,
        provenance: path.provenance,
        items: {
          create: path.items.map((item) => ({
            capabilityId: capability.id,
            learningUnitId: item.stage === "learn" ? learningUnit?.id : undefined,
            sequence: item.sequence,
            stage: item.stage,
            title: item.title,
            objective: item.objective,
            activity: item.activity,
            expectedOutput: item.expectedOutput,
            completionCondition: item.completionCondition,
            gapRationale: item.gapRationale,
            skillCode: item.skillCode,
            targetLevel: item.targetLevel
          }))
        }
      },
      include: { items: { orderBy: { sequence: "asc" } } }
    });
    return created;
  });
  return { path: saved, capability, diagnostic };
}

export async function getLatestPersonalPath(capabilityId: string, userId: string) {
  return db.personalCapabilityPath.findFirst({
    where: { capabilityId, userId },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { sequence: "asc" } } }
  });
}

export function serializePersonalPath(path: {
  id: string;
  capabilityId: string;
  diagnosticSessionId: string;
  status: string;
  observedLevel: number;
  targetLevel: number;
  capabilityGap: number;
  weaknessesSnapshot: unknown;
  evidenceSnapshot: unknown;
  skillsSnapshot: unknown;
  summary: string;
  provenance: string;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    capabilityId: string;
    learningUnitId: string | null;
    sequence: number;
    stage: string;
    title: string;
    objective: string;
    activity: string;
    expectedOutput: string;
    completionCondition: string;
    gapRationale: string;
    skillCode: string | null;
    targetLevel: number;
    status: string;
    completedAt: Date | null;
  }>;
}) {
  return {
    ...path,
    createdAt: path.createdAt.toISOString(),
    updatedAt: path.updatedAt.toISOString(),
    items: path.items.map((item) => ({ ...item, completedAt: item.completedAt?.toISOString() ?? null }))
  };
}
