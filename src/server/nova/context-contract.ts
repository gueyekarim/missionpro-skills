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