import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { tutorRequestSchema, type ContextContract, type TutorOutput, type TutorRequest } from "./nova/context-contract";
import { NovaOrchestrator } from "./nova/orchestrator";

type TutorSnapshot = {
  user: { id: string; name: string | null };
  capability: {
    id: string;
    code: string;
    name: string;
    description: string;
    context: Prisma.JsonValue | null;
    knowledgeRequirements: Prisma.JsonValue | null;
    observableTasks: Prisma.JsonValue | null;
    evidenceRequirements: Prisma.JsonValue | null;
    targetLevel: number | null;
    skills: Array<{ requiredLevel: number | null; skill: { code: string; name: string; description: string | null } }>;
  };
  diagnostic: {
    id: string;
    observedLevel: number;
    targetLevel: number;
    capabilityGap: number;
    weaknesses: Prisma.JsonValue;
    evidenceSupportingDiagnosis: Prisma.JsonValue;
    recommendedPriorities: Prisma.JsonValue;
  };
  path: {
    id: string;
    status: string;
    observedLevel: number;
    targetLevel: number;
    capabilityGap: number;
    summary: string;
    items: Array<{
      id: string;
      sequence: number;
      stage: string;
      title: string;
      objective: string;
      activity: string;
      expectedOutput: string;
      completionCondition: string;
      status: string;
      skillCode: string | null;
      learningUnit: { id: string; title: string; objective: string; type: string } | null;
    }>;
  } | null;
  currentItem: TutorSnapshot["path"] extends infer T ? T extends { items: Array<infer I> } ? I : never : never;
  previousActivities: Array<{ mode: string; action: string; stage: string | null; observedLevel: number; createdAt: string }>;
};

function jsonStrings(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function jsonRecords(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value)
    ? value.filter((item): item is Prisma.JsonObject => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];
}

export async function getTutorSnapshot(capabilityId: string, userId: string, pathItemId?: string): Promise<TutorSnapshot> {
  const [user, capability, diagnostic, path, interactions] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
    db.capability.findUnique({
      where: { id: capabilityId },
      select: {
        id: true, code: true, name: true, description: true, context: true,
        knowledgeRequirements: true, observableTasks: true, evidenceRequirements: true, targetLevel: true,
        skills: { select: { requiredLevel: true, skill: { select: { code: true, name: true, description: true } } } }
      }
    }),
    db.diagnosticSession.findFirst({
      where: { capabilityId, userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, observedLevel: true, targetLevel: true, capabilityGap: true,
        weaknesses: true, evidenceSupportingDiagnosis: true, recommendedPriorities: true
      }
    }),
    db.personalCapabilityPath.findFirst({
      where: { capabilityId, userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          orderBy: { sequence: "asc" },
          include: { learningUnit: { select: { id: true, title: true, objective: true, type: true } } }
        }
      }
    }),
    db.tutorInteraction.findMany({
      where: { capabilityId, userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { mode: true, action: true, stage: true, observedLevel: true, createdAt: true }
    })
  ]);
  if (!user) throw new Error("User not found");
  if (!capability) throw new Error("Capability not found");
  if (!diagnostic) throw new Error("Complete a diagnostic before using NOVA Tutor");
  if (pathItemId && (!path || !path.items.some((item) => item.id === pathItemId))) {
    throw new Error("Current path item not found");
  }

  const items = path?.items ?? [];
  const currentItem = pathItemId
    ? items.find((item) => item.id === pathItemId)
    : items.find((item) => item.status !== "completed") ?? items[items.length - 1];
  return {
    user,
    capability,
    diagnostic,
    path: path ? {
      id: path.id,
      status: path.status,
      observedLevel: path.observedLevel,
      targetLevel: path.targetLevel,
      capabilityGap: path.capabilityGap,
      summary: path.summary,
      items: path.items
    } : null,
    currentItem: currentItem as TutorSnapshot["currentItem"],
    previousActivities: interactions.map((interaction) => ({
      ...interaction,
      createdAt: interaction.createdAt.toISOString()
    }))
  };
}

export function buildTutorContext(snapshot: TutorSnapshot, request: Pick<TutorRequest, "mode" | "question">): ContextContract {
  const roleContext = jsonRecords(snapshot.capability.context)[0] ?? snapshot.capability.context;
  const pathSummary = snapshot.path
    ? {
        id: snapshot.path.id,
        status: snapshot.path.status,
        observedLevel: snapshot.path.observedLevel,
        targetLevel: snapshot.path.targetLevel,
        capabilityGap: snapshot.path.capabilityGap,
        summary: snapshot.path.summary,
        itemCount: snapshot.path.items.length
      }
    : undefined;
  const currentItem = snapshot.currentItem;
  return {
    user: {
      id: snapshot.user.id,
      name: snapshot.user.name ?? undefined
    },
    roleContext: typeof roleContext === "string" ? roleContext : JSON.stringify(roleContext ?? {}),
    currentCapability: {
      id: snapshot.capability.id,
      code: snapshot.capability.code,
      name: snapshot.capability.name,
      description: snapshot.capability.description,
      skills: snapshot.capability.skills.map(({ skill, requiredLevel }) => ({
        code: skill.code,
        name: skill.name,
        description: skill.description,
        requiredLevel: requiredLevel ?? snapshot.diagnostic.targetLevel
      })),
      knowledgeRequirements: jsonStrings(snapshot.capability.knowledgeRequirements),
      observableTasks: jsonStrings(snapshot.capability.observableTasks),
      evidenceRequirements: jsonStrings(snapshot.capability.evidenceRequirements)
    },
    observedMasteryLevel: snapshot.diagnostic.observedLevel,
    targetMasteryLevel: snapshot.diagnostic.targetLevel,
    currentLearningUnit: currentItem?.learningUnit
      ? { ...currentItem.learningUnit }
      : undefined,
    currentPath: pathSummary,
    currentPathItem: currentItem
      ? {
          id: currentItem.id,
          sequence: currentItem.sequence,
          stage: currentItem.stage,
          title: currentItem.title,
          objective: currentItem.objective,
          activity: currentItem.activity,
          expectedOutput: currentItem.expectedOutput,
          completionCondition: currentItem.completionCondition,
          skillCode: currentItem.skillCode,
          status: currentItem.status
        }
      : undefined,
    recentAssessments: [],
    evidenceAvailable: jsonRecords(snapshot.diagnostic.evidenceSupportingDiagnosis),
    previousLearningActivities: snapshot.previousActivities,
    weaknessesOrGaps: [
      ...jsonStrings(snapshot.diagnostic.weaknesses),
      ...jsonStrings(snapshot.diagnostic.recommendedPriorities)
    ],
    recommendedNextAction: currentItem?.completionCondition ?? "Relier la question à une production observable.",
    currentTask: `[${request.mode}] ${request.question}`
  };
}

export async function generateTutorResponse(input: unknown, userId: string) {
  const request = tutorRequestSchema.parse(input);
  const snapshot = await getTutorSnapshot(request.capabilityId, userId, request.pathItemId);
  const context = buildTutorContext(snapshot, request);
  const task = JSON.stringify({
    mode: request.mode,
    question: request.question,
    capability: { code: snapshot.capability.code, name: snapshot.capability.name },
    skills: snapshot.capability.skills.map(({ skill, requiredLevel }) => ({ ...skill, requiredLevel })),
    diagnostic: {
      observedLevel: snapshot.diagnostic.observedLevel,
      targetLevel: snapshot.diagnostic.targetLevel,
      capabilityGap: snapshot.diagnostic.capabilityGap,
      weaknesses: snapshot.diagnostic.weaknesses,
      evidence: snapshot.diagnostic.evidenceSupportingDiagnosis
    },
    currentPath: snapshot.path,
    currentItem: snapshot.currentItem
  });
  const output = await new NovaOrchestrator().runTutor(context, task);
  const interaction = await db.tutorInteraction.create({
    data: {
      userId,
      capabilityId: snapshot.capability.id,
      pathId: snapshot.path?.id,
      pathItemId: snapshot.currentItem?.id,
      mode: request.mode,
      action: "contextual_tutoring_response",
      observedLevel: snapshot.diagnostic.observedLevel,
      targetLevel: snapshot.diagnostic.targetLevel,
      stage: snapshot.currentItem?.stage
    },
    select: { id: true, mode: true, action: true, createdAt: true }
  });
  return {
    output,
    interaction: { ...interaction, createdAt: interaction.createdAt.toISOString() },
    contextSummary: {
      capability: { id: snapshot.capability.id, code: snapshot.capability.code, name: snapshot.capability.name },
      observedLevel: snapshot.diagnostic.observedLevel,
      targetLevel: snapshot.diagnostic.targetLevel,
      capabilityGap: snapshot.diagnostic.capabilityGap,
      currentItem: snapshot.currentItem ? {
        id: snapshot.currentItem.id,
        sequence: snapshot.currentItem.sequence,
        stage: snapshot.currentItem.stage,
        title: snapshot.currentItem.title,
        status: snapshot.currentItem.status
      } : null
    }
  };
}

export function serializeTutorSnapshot(snapshot: TutorSnapshot) {
  return {
    capability: {
      id: snapshot.capability.id,
      code: snapshot.capability.code,
      name: snapshot.capability.name,
      skills: snapshot.capability.skills.map(({ skill, requiredLevel }) => ({
        code: skill.code,
        name: skill.name,
        requiredLevel: requiredLevel ?? snapshot.diagnostic.targetLevel
      }))
    },
    diagnostic: {
      id: snapshot.diagnostic.id,
      observedLevel: snapshot.diagnostic.observedLevel,
      targetLevel: snapshot.diagnostic.targetLevel,
      capabilityGap: snapshot.diagnostic.capabilityGap
    },
    path: snapshot.path ? {
      id: snapshot.path.id,
      status: snapshot.path.status,
      summary: snapshot.path.summary,
      items: snapshot.path.items.map((item) => ({
        id: item.id,
        sequence: item.sequence,
        stage: item.stage,
        title: item.title,
        status: item.status,
        skillCode: item.skillCode
      }))
    } : null,
    currentItem: snapshot.currentItem ? {
      id: snapshot.currentItem.id,
      sequence: snapshot.currentItem.sequence,
      stage: snapshot.currentItem.stage,
      title: snapshot.currentItem.title,
      objective: snapshot.currentItem.objective,
      activity: snapshot.currentItem.activity,
      expectedOutput: snapshot.currentItem.expectedOutput,
      completionCondition: snapshot.currentItem.completionCondition,
      status: snapshot.currentItem.status
    } : null,
    previousActivities: snapshot.previousActivities,
    modes: ["LEARN", "ASK NOVA", "MY WORK"]
  };
}
