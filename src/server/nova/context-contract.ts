import { z } from "zod";

export const novaModes = ["architect", "diagnostician", "tutor", "practice", "assessor", "mentor"] as const;
export type NovaMode = (typeof novaModes)[number];

export const contextContractSchema = z.object({
  user: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      role: z.string().optional(),
      profile: z.record(z.unknown()).optional()
    })
    .optional(),
  roleContext: z.string().optional(),
  currentCapability: z
    .object({
      id: z.string().optional(),
      code: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional()
    })
    .optional(),
  observedMasteryLevel: z.number().int().min(1).max(5).optional(),
  targetMasteryLevel: z.number().int().min(1).max(5).optional(),
  currentLearningUnit: z.record(z.unknown()).optional(),
  recentAssessments: z.array(z.record(z.unknown())).default([]),
  evidenceAvailable: z.array(z.record(z.unknown())).default([]),
  weaknessesOrGaps: z.array(z.string()).default([]),
  recommendedNextAction: z.string().optional(),
  currentTask: z.string().optional()
});

export type ContextContract = z.infer<typeof contextContractSchema>;

export const novaSmokeOutputSchema = z.object({
  mode: z.enum(novaModes),
  message: z.string().min(1).max(4000),
  nextAction: z.string().min(1).max(500),
  confidence: z.number().min(0).max(1)
});

export type NovaSmokeOutput = z.infer<typeof novaSmokeOutputSchema>;

export const capabilitySkillDraftSchema = z.object({
  code: z.string().regex(/^SKILL-[A-Z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.string().min(1).max(100),
  skillType: z.string().min(1).max(100),
  requiredLevel: z.number().int().min(1).max(5)
});

export const capabilityDraftSchema = z.object({
  code: z.string().regex(/^CAP-[A-Z0-9-]+$/),
  sourceIntent: z.string().min(1).max(500),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  domain: z.string().min(1).max(200),
  purpose: z.string().min(1).max(1000),
  businessOutcome: z.string().min(1).max(1000),
  outcomes: z.array(z.string().min(1).max(500)).min(1).max(12),
  skills: z.array(capabilitySkillDraftSchema).min(1).max(20),
  knowledgeRequirements: z.array(z.string().min(1).max(500)).max(20),
  observableTasks: z.array(z.string().min(1).max(500)).min(1).max(20),
  targetLevel: z.number().int().min(1).max(5),
  successCriteria: z.array(z.string().min(1).max(500)).min(1).max(20),
  expectedEvidence: z.array(z.string().min(1).max(500)).min(1).max(20)
});

export type CapabilitySkillDraft = z.infer<typeof capabilitySkillDraftSchema>;
export type CapabilityDraft = z.infer<typeof capabilityDraftSchema>;