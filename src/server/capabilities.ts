import "server-only";

import type { Prisma } from "@prisma/client";
import { capabilityDraftSchema, type CapabilityDraft } from "./nova/context-contract";
import { db } from "@/lib/db";

type CapabilityWithSkills = Prisma.CapabilityGetPayload<{
  include: { skills: { include: { skill: true } } };
}>;

function jsonStrings(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function capabilityDraftToData(draft: CapabilityDraft, userId: string) {
  return {
    code: draft.code,
    name: draft.name,
    description: draft.description,
    domain: draft.domain,
    purpose: draft.purpose,
    businessOutcome: draft.businessOutcome,
    sourceIntent: draft.sourceIntent,
    outcomes: draft.outcomes,
    knowledgeRequirements: draft.knowledgeRequirements,
    observableTasks: draft.observableTasks,
    successCriteria: draft.successCriteria,
    evidenceRequirements: draft.expectedEvidence,
    targetLevel: draft.targetLevel,
    status: "active",
    createdById: userId
  };
}

export async function persistCapabilityDraft(input: unknown, userId: string, capabilityId?: string) {
  const draft = capabilityDraftSchema.parse(input);
  return db.$transaction(async (tx) => {
    const existing = capabilityId
      ? await tx.capability.findUnique({ where: { id: capabilityId } })
      : await tx.capability.findUnique({ where: { code: draft.code } });

    if (existing?.createdById && existing.createdById !== userId) {
      throw new Error("This capability belongs to another user");
    }

    const capability = existing
      ? await tx.capability.update({
          where: { id: existing.id },
          data: { ...capabilityDraftToData(draft, userId), version: { increment: 1 } }
        })
      : await tx.capability.create({ data: capabilityDraftToData(draft, userId) });

    await tx.capabilitySkill.deleteMany({ where: { capabilityId: capability.id } });
    for (const skillDraft of draft.skills) {
      const skill = await tx.skill.upsert({
        where: { code: skillDraft.code },
        update: {
          name: skillDraft.name,
          description: skillDraft.description,
          category: skillDraft.category,
          skillType: skillDraft.skillType
        },
        create: {
          code: skillDraft.code,
          name: skillDraft.name,
          description: skillDraft.description,
          category: skillDraft.category,
          skillType: skillDraft.skillType
        }
      });
      await tx.capabilitySkill.create({
        data: {
          capabilityId: capability.id,
          skillId: skill.id,
          weight: 1,
          requiredLevel: skillDraft.requiredLevel
        }
      });
    }

    return tx.capability.findUniqueOrThrow({
      where: { id: capability.id },
      include: { skills: { include: { skill: true } } }
    });
  });
}

export function serializeCapability(capability: CapabilityWithSkills) {
  return {
    id: capability.id,
    code: capability.code,
    name: capability.name,
    description: capability.description,
    domain: capability.domain ?? "",
    purpose: capability.purpose ?? "",
    businessOutcome: capability.businessOutcome ?? "",
    sourceIntent: capability.sourceIntent ?? capability.name,
    outcomes: jsonStrings(capability.outcomes),
    knowledgeRequirements: jsonStrings(capability.knowledgeRequirements),
    observableTasks: jsonStrings(capability.observableTasks),
    successCriteria: jsonStrings(capability.successCriteria),
    expectedEvidence: jsonStrings(capability.evidenceRequirements),
    targetLevel: capability.targetLevel ?? 3,
    status: capability.status,
    version: capability.version,
    updatedAt: capability.updatedAt.toISOString(),
    skills: capability.skills.map(({ skill, requiredLevel }) => ({
      id: skill.id,
      code: skill.code,
      name: skill.name,
      description: skill.description ?? "",
      category: skill.category ?? "professional",
      skillType: skill.skillType ?? "professional",
      requiredLevel: requiredLevel ?? capability.targetLevel ?? 3
    }))
  };
}