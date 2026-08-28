import "server-only";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { buildTutorContext, getTutorSnapshot } from "./tutor";
import { NovaOrchestrator } from "./nova/orchestrator";
import {
  assessorOutputSchema,
  practiceCriterionSchema,
  practiceTypes,
  type AssessorOutput,
  type ContextContract
} from "./nova/context-contract";

export const practiceSubmissionSchema = z.object({
  activityId: z.string().uuid(),
  production: z.string().trim().min(50).max(20000)
});

export const practiceReviewSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("contest"), assessmentAttemptId: z.string().uuid(), reason: z.string().trim().min(10).max(2000) }),
  z.object({ action: z.literal("reassess"), submissionId: z.string().uuid() })
]);

export const mp001Rubric = [
  { code: "risk_identification", label: "Risk identification", maxScore: 5, weight: 0.18 },
  { code: "probability_impact", label: "Probability / impact analysis", maxScore: 5, weight: 0.17 },
  { code: "prioritization", label: "Risk prioritization", maxScore: 5, weight: 0.18 },
  { code: "treatment_strategy", label: "Treatment strategy", maxScore: 5, weight: 0.17 },
  { code: "reasoning", label: "Quality of reasoning", maxScore: 5, weight: 0.15 },
  { code: "professional_output", label: "Quality and usability of professional output", maxScore: 5, weight: 0.15 }
].map((criterion) => practiceCriterionSchema.parse(criterion));

type Snapshot = Awaited<ReturnType<typeof getTutorSnapshot>>;
type ActivitySeed = {
  type: (typeof practiceTypes)[number];
  title: string;
  scenario: string;
  objective: string;
  expectedOutput: string;
  stage: string;
  skillCode: string;
};

const mp001Activities: ActivitySeed[] = [
  {
    type: "exercise",
    title: "Guided exercise — qualify two public-project risks",
    scenario: "A municipal digital-service project depends on a new supplier and a legal review. Complete the guided analysis for one delivery risk and one compliance risk.",
    objective: "Identify observable risk events and qualify probability, impact and initial priority.",
    expectedOutput: "A two-row matrix: risk event, cause, consequence, probability, impact, priority and first response.",
    stage: "practice",
    skillCode: "SKILL-RISK-QUALIFICATION"
  },
  {
    type: "case",
    title: "Professional case — protect a delayed public programme",
    scenario: "A regional programme is six weeks late. A critical supplier has missed two milestones, user representatives reject part of the scope and the next budget tranche depends on a governance review. Analyse the situation and prepare a decision-ready risk view.",
    objective: "Turn a multi-signal professional situation into prioritized, actionable project risks.",
    expectedOutput: "A contextualized matrix with at least four risks, probability, impact, priority, response, owner and concise justification.",
    stage: "apply",
    skillCode: "SKILL-RISK-CONTEXT"
  },
  {
    type: "challenge",
    title: "MP-001 reference challenge — critical public service launch",
    scenario: "You lead the launch of a public benefits portal due in eight weeks. The identity supplier reports unstable integration tests; accessibility testing found blocking defects; a policy change may alter eligibility rules; the support centre is understaffed; and postponement would affect statutory commitments. Analyse the situation, identify the risks, assess probability and impact, prioritize them and propose proportionate treatment actions with accountable owners.",
    objective: "Demonstrate an explainable risk-prioritization decision under competing public-project constraints.",
    expectedOutput: "A decision-ready risk matrix plus a short rationale defending the top three priorities and their treatment strategies.",
    stage: "challenge",
    skillCode: "SKILL-RISK-PRIORITIZATION"
  },
  {
    type: "simulation",
    title: "Short simulation — defend priorities to the steering committee",
    scenario: "The steering committee gives you five minutes to defend which two risks require immediate escalation. Finance favours schedule protection, operations favours support readiness and legal insists on policy compliance. Prepare your recommendation and respond to these competing positions.",
    objective: "Defend a prioritization using explicit criteria rather than preference or urgency alone.",
    expectedOutput: "A concise committee briefing: selected risks, scoring logic, rejected alternative, treatment, owner and trigger for review.",
    stage: "challenge",
    skillCode: "SKILL-RISK-PRIORITIZATION"
  },
  {
    type: "real_work",
    title: "Real-work task — review your current risk register",
    scenario: "Use a current or safely anonymized public-project situation. Select a decision that could be improved by an explicit risk-prioritization analysis.",
    objective: "Transfer MP-001 into a professional workflow without treating task completion as mastery.",
    expectedOutput: "An anonymized, usable risk register extract and a short decision note linking priorities to treatments and owners.",
    stage: "apply",
    skillCode: "SKILL-RISK-PRIORITIZATION"
  }
];

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function genericActivities(snapshot: Snapshot): ActivitySeed[] {
  const capabilityName = snapshot.capability.name.toLocaleLowerCase();
  const skillCode = snapshot.capability.skills[0]?.skill.code ?? "CAPABILITY";
  return practiceTypes.map((type) => ({
    type,
    title: `${type.replace("_", " ")} — ${snapshot.capability.name}`,
    scenario: `Traitez une situation professionnelle réaliste dans laquelle vous devez ${capabilityName}. Explicitez le contexte, l’action, les critères et les arbitrages.`,
    objective: `Produire une performance observable liée à « ${snapshot.capability.name} ».`,
    expectedOutput: "Un livrable professionnel structuré avec décisions, critères, justification et prochaine action.",
    stage: type === "challenge" || type === "simulation" ? "challenge" : type === "exercise" ? "practice" : "apply",
    skillCode
  }));
}

async function loadPracticeDashboard(capabilityId: string, userId: string) {
  const snapshot = await getTutorSnapshot(capabilityId, userId);
  const activities = await db.practiceActivity.findMany({
    where: { capabilityId, userId },
    orderBy: { createdAt: "asc" },
    include: {
      submissions: {
        where: { userId },
        orderBy: { submittedAt: "desc" },
        include: { assessments: { orderBy: { createdAt: "desc" } } }
      }
    }
  });
  return { snapshot, activities };
}

export async function ensurePracticeActivities(capabilityId: string, userId: string): Promise<Awaited<ReturnType<typeof loadPracticeDashboard>>> {
  const snapshot = await getTutorSnapshot(capabilityId, userId);
  const assessment = await db.capabilityAssessment.findFirst({
    where: { capabilityId },
    select: { assessmentId: true }
  });
  const seeds = snapshot.capability.code === "CAP-PROJ-RISK-001" ? mp001Activities : genericActivities(snapshot);
  const weaknesses = [
    ...strings(snapshot.diagnostic.weaknesses),
    ...strings(snapshot.diagnostic.recommendedPriorities)
  ];
  await db.$transaction(seeds.map((seed) => {
    const pathItem = snapshot.path?.items.find((item) => item.stage === seed.stage)
      ?? snapshot.path?.items.find((item) => item.skillCode === seed.skillCode)
      ?? snapshot.currentItem;
    return db.practiceActivity.upsert({
      where: { userId_capabilityId_type: { userId, capabilityId, type: seed.type } },
      update: {
        pathItemId: pathItem?.id,
        assessmentId: assessment?.assessmentId,
        title: seed.title,
        scenario: seed.scenario,
        objective: seed.objective,
        expectedOutput: seed.expectedOutput,
        masteryLevel: pathItem?.targetLevel ?? snapshot.diagnostic.targetLevel,
        skillCode: seed.skillCode,
        gapRationale: weaknesses.join(" ") || `Practice is required to produce observable performance at level ${snapshot.diagnostic.targetLevel}.`,
        assessmentCriteria: mp001Rubric as unknown as Prisma.InputJsonValue
      },
      create: {
        userId,
        capabilityId,
        pathItemId: pathItem?.id,
        assessmentId: assessment?.assessmentId,
        type: seed.type,
        title: seed.title,
        scenario: seed.scenario,
        objective: seed.objective,
        expectedOutput: seed.expectedOutput,
        masteryLevel: pathItem?.targetLevel ?? snapshot.diagnostic.targetLevel,
        skillCode: seed.skillCode,
        gapRationale: weaknesses.join(" ") || `Practice is required to produce observable performance at level ${snapshot.diagnostic.targetLevel}.`,
        assessmentCriteria: mp001Rubric as unknown as Prisma.InputJsonValue
      }
    });
  }));
  return loadPracticeDashboard(capabilityId, userId);
}

export async function getPracticeDashboard(capabilityId: string, userId: string, ensure = true): Promise<Awaited<ReturnType<typeof loadPracticeDashboard>>> {
  if (ensure) return ensurePracticeActivities(capabilityId, userId);
  return loadPracticeDashboard(capabilityId, userId);
}

function validateAgainstRubric(output: AssessorOutput, criteria: typeof mp001Rubric) {
  const parsed = assessorOutputSchema.parse(output);
  if (parsed.provenance !== "AI assessed") throw new Error("NOVA Assessor provenance must remain AI assessed");
  if (parsed.criterionScores.length !== criteria.length) throw new Error("Assessment does not cover the complete rubric");
  for (const criterion of criteria) {
    const result = parsed.criterionScores.find((item) => item.code === criterion.code);
    if (!result || result.maxScore !== criterion.maxScore || result.weight !== criterion.weight) {
      throw new Error(`Assessment altered rubric criterion ${criterion.code}`);
    }
  }
  const expected = Math.round(parsed.criterionScores.reduce((sum, item) => sum + (item.score / item.maxScore) * item.weight, 0) * 100);
  if (Math.abs(expected - parsed.overallScore) > 1) throw new Error("Assessment overall score is inconsistent with criterion scores");
  return parsed;
}

function assessmentContext(snapshot: Snapshot, activity: {
  id: string; type: string; title: string; scenario: string; objective: string; expectedOutput: string;
  masteryLevel: number; skillCode: string | null; gapRationale: string; assessmentCriteria: Prisma.JsonValue;
}, production: string): ContextContract {
  return {
    ...buildTutorContext(snapshot, { mode: "MY WORK", question: activity.scenario }),
    currentPracticeActivity: {
      id: activity.id,
      type: activity.type,
      title: activity.title,
      objective: activity.objective,
      expectedOutput: activity.expectedOutput,
      masteryLevel: activity.masteryLevel,
      skillCode: activity.skillCode,
      gapRationale: activity.gapRationale,
      assessmentCriteria: activity.assessmentCriteria
    },
    currentProduction: production,
    recentAssessments: []
  };
}

async function assess(activity: {
  id: string; type: string; title: string; scenario: string; objective: string; expectedOutput: string;
  masteryLevel: number; skillCode: string | null; gapRationale: string; assessmentCriteria: Prisma.JsonValue;
  capabilityId: string; pathItemId: string | null;
}, production: string, userId: string) {
  const snapshot = await getTutorSnapshot(activity.capabilityId, userId, activity.pathItemId ?? undefined);
  const criteria = z.array(practiceCriterionSchema).parse(activity.assessmentCriteria);
  const output = await new NovaOrchestrator().runAssessor(
    assessmentContext(snapshot, activity, production),
    JSON.stringify({ activity: { ...activity, assessmentCriteria: criteria }, production })
  );
  return validateAgainstRubric(output, criteria);
}

export async function submitPractice(input: unknown, userId: string) {
  const request = practiceSubmissionSchema.parse(input);
  const activity = await db.practiceActivity.findFirst({ where: { id: request.activityId, userId } });
  if (!activity) throw new Error("Practice activity not found");
  const output = await assess(activity, request.production, userId);
  const saved = await db.$transaction(async (tx) => {
    const submission = await tx.practiceSubmission.create({
      data: { userId, activityId: activity.id, production: request.production }
    });
    const attempt = await tx.practiceAssessmentAttempt.create({
      data: {
        userId,
        submissionId: submission.id,
        activityId: activity.id,
        overallScore: output.overallScore,
        criterionScores: output.criterionScores as unknown as Prisma.InputJsonValue,
        strengths: output.strengths,
        weaknesses: output.weaknesses,
        missingElements: output.missingElements,
        explanation: output.explanation,
        feedback: output.feedback,
        recommendedNextAction: output.recommendedNextAction,
        masteryRecommendation: output.masteryRecommendation,
        provenance: output.provenance
      }
    });
    return { submission, attempt };
  });
  return { activity, output, ...saved };
}

export async function reviewPractice(input: unknown, userId: string) {
  const request = practiceReviewSchema.parse(input);
  if (request.action === "contest") {
    const attempt = await db.practiceAssessmentAttempt.findFirst({ where: { id: request.assessmentAttemptId, userId } });
    if (!attempt) throw new Error("Assessment attempt not found");
    return {
      action: "contested" as const,
      attempt: await db.practiceAssessmentAttempt.update({
        where: { id: attempt.id },
        data: { status: "contested", contestReason: request.reason, contestedAt: new Date() }
      })
    };
  }
  const submission = await db.practiceSubmission.findFirst({
    where: { id: request.submissionId, userId },
    include: { activity: true }
  });
  if (!submission) throw new Error("Practice submission not found");
  const output = await assess(submission.activity, submission.production, userId);
  const attempt = await db.practiceAssessmentAttempt.create({
    data: {
      userId,
      submissionId: submission.id,
      activityId: submission.activityId,
      overallScore: output.overallScore,
      criterionScores: output.criterionScores as unknown as Prisma.InputJsonValue,
      strengths: output.strengths,
      weaknesses: output.weaknesses,
      missingElements: output.missingElements,
      explanation: output.explanation,
      feedback: output.feedback,
      recommendedNextAction: output.recommendedNextAction,
      masteryRecommendation: output.masteryRecommendation,
      provenance: output.provenance,
      status: "AI assessed"
    }
  });
  return { action: "reassessed" as const, output, attempt };
}

export function serializePracticeDashboard(dashboard: Awaited<ReturnType<typeof getPracticeDashboard>>) {
  return {
    capability: {
      id: dashboard.snapshot.capability.id,
      code: dashboard.snapshot.capability.code,
      name: dashboard.snapshot.capability.name
    },
    diagnostic: {
      observedLevel: dashboard.snapshot.diagnostic.observedLevel,
      targetLevel: dashboard.snapshot.diagnostic.targetLevel,
      capabilityGap: dashboard.snapshot.diagnostic.capabilityGap
    },
    governance: {
      levels: ["AI assessed", "Human validated", "MissionPro verified", "Externally certified"],
      notice: "Assessment ≠ Certification. An AI assessment does not update verified mastery."
    },
    activities: dashboard.activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      scenario: activity.scenario,
      objective: activity.objective,
      expectedOutput: activity.expectedOutput,
      masteryLevel: activity.masteryLevel,
      skillCode: activity.skillCode,
      gapRationale: activity.gapRationale,
      assessmentCriteria: activity.assessmentCriteria,
      submissions: activity.submissions.map((submission) => ({
        id: submission.id,
        production: submission.production,
        submittedAt: submission.submittedAt.toISOString(),
        assessments: submission.assessments.map((attempt) => ({
          ...attempt,
          createdAt: attempt.createdAt.toISOString(),
          contestedAt: attempt.contestedAt?.toISOString() ?? null
        }))
      }))
    }))
  };
}