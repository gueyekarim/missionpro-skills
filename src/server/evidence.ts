import "server-only";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";

export const evidenceStatuses = [
  "Self-declared",
  "AI assessed",
  "Human validated",
  "MissionPro verified",
  "Externally certified"
] as const;

export const saveEvidenceSchema = z.object({
  submissionId: z.string().uuid()
});

type AssessmentRecord = {
  id: string;
  overallScore: number;
  criterionScores: Prisma.JsonValue;
  strengths: Prisma.JsonValue;
  weaknesses: Prisma.JsonValue;
  missingElements: Prisma.JsonValue;
  explanation: string;
  feedback: string;
  recommendedNextAction: string;
  masteryRecommendation: string | null;
  provenance: string;
  status: string;
  contestReason: string | null;
  contestedAt: Date | null;
  createdAt: Date;
};

function assessmentSnapshot(attempt: AssessmentRecord) {
  return {
    id: attempt.id,
    overallScore: attempt.overallScore,
    criterionScores: attempt.criterionScores,
    strengths: attempt.strengths,
    weaknesses: attempt.weaknesses,
    missingElements: attempt.missingElements,
    explanation: attempt.explanation,
    feedback: attempt.feedback,
    recommendedNextAction: attempt.recommendedNextAction,
    masteryRecommendation: attempt.masteryRecommendation,
    provenance: attempt.provenance,
    status: attempt.status,
    contestReason: attempt.contestReason,
    contestedAt: attempt.contestedAt?.toISOString() ?? null,
    createdAt: attempt.createdAt.toISOString()
  };
}

export async function saveSubmissionAsEvidence(input: unknown, userId: string) {
  const request = saveEvidenceSchema.parse(input);
  const submission = await db.practiceSubmission.findFirst({
    where: { id: request.submissionId, userId },
    include: {
      activity: { include: { capability: true } },
      assessments: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!submission) throw new Error("Practice submission not found");
  const latest = submission.assessments[0];
  if (!latest) throw new Error("Only an assessed production can be saved as evidence");
  if (latest.provenance !== "AI assessed") throw new Error("Evidence provenance is invalid");

  const evidence = await db.evidence.upsert({
    where: { userId_practiceSubmissionId: { userId, practiceSubmissionId: submission.id } },
    update: {
      practiceActivityId: submission.activityId,
      practiceAssessmentAttemptId: latest.id,
      skillCode: submission.activity.skillCode,
      criteriaSnapshot: submission.activity.assessmentCriteria as Prisma.InputJsonValue,
      title: `Evidence — ${submission.activity.title}`,
      description: `Produced work from ${submission.activity.type}; latest assessment score ${latest.overallScore}/100.`,
      artifactText: submission.production,
      score: latest.overallScore,
      assessorType: "AI",
      aiAssessment: assessmentSnapshot(latest),
      status: "AI assessed",
      provenance: "AI assessed",
      validationRequired: true,
      verified: false
    },
    create: {
      userId,
      capabilityId: submission.activity.capabilityId,
      assessmentId: submission.activity.assessmentId,
      practiceActivityId: submission.activityId,
      practiceSubmissionId: submission.id,
      practiceAssessmentAttemptId: latest.id,
      skillCode: submission.activity.skillCode,
      criteriaSnapshot: submission.activity.assessmentCriteria as Prisma.InputJsonValue,
      evidenceType: "assessed_practice_production",
      title: `Evidence — ${submission.activity.title}`,
      description: `Produced work from ${submission.activity.type}; latest assessment score ${latest.overallScore}/100.`,
      artifactText: submission.production,
      score: latest.overallScore,
      assessorType: "AI",
      aiAssessment: assessmentSnapshot(latest),
      status: "AI assessed",
      provenance: "AI assessed",
      validationRequired: true,
      verified: false
    }
  });
  return serializeEvidence(evidence);
}

export async function getEvidencePortfolio(userId: string) {
  const evidence = await db.evidence.findMany({
    where: { userId },
    orderBy: [{ capability: { code: "asc" } }, { createdAt: "desc" }],
    include: {
      capability: { select: { id: true, code: true, name: true, description: true } },
      practiceActivity: { select: { id: true, type: true, title: true, objective: true, expectedOutput: true, skillCode: true } },
      practiceSubmission: {
        select: {
          id: true,
          production: true,
          submittedAt: true,
          assessments: { orderBy: { createdAt: "desc" } }
        }
      },
      practiceAssessmentAttempt: true
    }
  });
  const groups = new Map<string, {
    capability: typeof evidence[number]["capability"];
    evidence: ReturnType<typeof serializeEvidence>[];
  }>();
  for (const item of evidence) {
    const serialized = serializeEvidence(item);
    const group = groups.get(item.capabilityId) ?? { capability: item.capability, evidence: [] };
    group.evidence.push(serialized);
    groups.set(item.capabilityId, group);
  }
  return {
    statuses: evidenceStatuses,
    governance: "Evidence is not certification. AI assessed evidence requires further validation.",
    groups: [...groups.values()]
  };
}

export function serializeEvidence(evidence: {
  id: string;
  userId: string;
  capabilityId: string;
  assessmentId: string | null;
  practiceActivityId: string | null;
  practiceSubmissionId: string | null;
  practiceAssessmentAttemptId: string | null;
  skillCode: string | null;
  criteriaSnapshot: Prisma.JsonValue | null;
  status: string;
  provenance: string;
  validationRequired: boolean;
  evidenceType: string;
  title: string;
  description: string | null;
  artifactText: string | null;
  score: Prisma.Decimal | null;
  assessorType: string;
  verified: boolean;
  createdAt: Date;
  capability?: { id: string; code: string; name: string; description?: string };
  practiceActivity?: { id: string; type: string; title: string; objective: string; expectedOutput: string; skillCode: string | null } | null;
  practiceSubmission?: {
    id: string;
    production: string;
    submittedAt: Date;
    assessments: AssessmentRecord[];
  } | null;
  practiceAssessmentAttempt?: AssessmentRecord | null;
}) {
  return {
    id: evidence.id,
    capability: evidence.capability,
    title: evidence.title,
    description: evidence.description,
    producedWork: evidence.artifactText,
    source: evidence.practiceActivity ? {
      id: evidence.practiceActivity.id,
      type: evidence.practiceActivity.type,
      title: evidence.practiceActivity.title,
      objective: evidence.practiceActivity.objective,
      expectedOutput: evidence.practiceActivity.expectedOutput,
      skillCode: evidence.practiceActivity.skillCode
    } : null,
    assessment: evidence.practiceAssessmentAttempt ? assessmentSnapshot(evidence.practiceAssessmentAttempt) : null,
    assessmentHistory: evidence.practiceSubmission?.assessments.map(assessmentSnapshot) ?? [],
    criteria: evidence.criteriaSnapshot,
    score: evidence.score?.toString() ?? null,
    assessorType: evidence.assessorType,
    status: evidence.status,
    provenance: evidence.provenance,
    verified: evidence.verified,
    validationRequired: evidence.validationRequired,
    createdAt: evidence.createdAt.toISOString()
  };
}