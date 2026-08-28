import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { evidenceStatuses } from "./evidence";

export const masteryScale = [
  { level: 1, name: "Awareness" },
  { level: 2, name: "Assisted Practice" },
  { level: 3, name: "Autonomous Practice" },
  { level: 4, name: "Advanced Practice" },
  { level: 5, name: "System Mastery" }
] as const;

const statusRank: Record<string, number> = {
  "Self-declared": 1,
  "AI assessed": 2,
  "Human validated": 3,
  "MissionPro verified": 4,
  "Externally certified": 5
};

type CriterionResult = { code?: string; label?: string; score?: number; maxScore?: number };
type AggregationEvidence = {
  id: string;
  score: number | string | null;
  status: string;
  provenance: string;
  assessorType: string;
  verified?: boolean;
  humanValidation?: Prisma.JsonValue | null;
  createdAt: Date | string;
  practiceActivity?: { type: string; title: string; masteryLevel: number } | null;
  criteriaSnapshot?: Prisma.JsonValue | null;
  aiAssessment?: Prisma.JsonValue | null;
};

function jsonRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function criterionResults(evidence: AggregationEvidence): CriterionResult[] {
  const assessment = jsonRecord(evidence.aiAssessment);
  return Array.isArray(assessment.criterionScores) ? assessment.criterionScores as CriterionResult[] : [];
}

function scoreNumber(score: number | string | null) {
  const parsed = typeof score === "number" ? score : Number(score);
  return Number.isFinite(parsed) ? parsed : null;
}

function criterionCoverage(evidence: AggregationEvidence) {
  const results = criterionResults(evidence);
  if (!results.length) return 0;
  const covered = results.filter((criterion) => (criterion.score ?? 0) >= Math.ceil((criterion.maxScore ?? 5) * 0.6)).length;
  return covered / results.length;
}

function evidenceQuality(score: number, coverage: number): "weak" | "moderate" | "strong" {
  if (score >= 85 && coverage >= 0.75) return "strong";
  if (score >= 70 && coverage >= 0.5) return "moderate";
  return "weak";
}

function difficultyFactor(type: string | undefined) {
  return type === "real_work" ? 1.25 : type === "challenge" || type === "simulation" ? 1.15 : type === "case" ? 1.05 : 1;
}

function recencyFactor(createdAt: Date | string) {
  const ageDays = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 86400000);
  return Math.max(0.7, 1 - (ageDays / 365) * 0.3);
}

function candidateLevel(evidence: AggregationEvidence, score: number, coverage: number) {
  const activityLevel = evidence.practiceActivity?.masteryLevel ?? 1;
  if (score < 60 || coverage < 0.5) return null;
  if (score < 75 || coverage < 0.75) return Math.max(1, activityLevel - 1);
  return Math.min(5, activityLevel);
}

function formatLevel(level: number | null) {
  return level === null ? "Not established" : `${level} — ${masteryScale[level - 1]?.name ?? "Unknown"}`;
}

export function aggregateCapabilityMastery(input: {
  observedLevel: number;
  targetLevel: number;
  evidence: AggregationEvidence[];
}) {
  const inspected = input.evidence.map((evidence) => {
    const score = scoreNumber(evidence.score);
    const coverage = criterionCoverage(evidence);
    const quality = score === null ? "weak" as const : evidenceQuality(score, coverage);
    const candidate = score === null ? null : candidateLevel(evidence, score, coverage);
    const claimedStatus = evidenceStatuses.includes(evidence.status as (typeof evidenceStatuses)[number]) ? evidence.status : "Self-declared";
    const validationIntegrity = claimedStatus === "Human validated"
      ? Boolean(evidence.humanValidation)
      : (statusRank[claimedStatus] ?? 1) >= 4 ? evidence.verified === true : true;
    const status = validationIntegrity ? claimedStatus : claimedStatus === "Self-declared" ? "Self-declared" : "AI assessed";
    const supportWeight = (score === null || candidate === null ? 0 : (score / 100) * (coverage || 0.5))
      * (statusRank[status] / 5) * difficultyFactor(evidence.practiceActivity?.type) * recencyFactor(evidence.createdAt);
    return {
      id: evidence.id,
      createdAt: new Date(evidence.createdAt).toISOString(),
      score,
      status,
      claimedStatus,
      verified: evidence.verified === true,
      provenance: evidence.provenance,
      assessorType: evidence.assessorType,
      quality,
      candidateLevel: candidate,
      eligibleForDemonstration: candidate !== null && (statusRank[status] ?? 1) >= 2,
      criterionCoverage: Math.round(coverage * 100),
      difficulty: evidence.practiceActivity?.type ?? "unspecified",
      difficultyFactor: difficultyFactor(evidence.practiceActivity?.type),
      recencyFactor: Math.round(recencyFactor(evidence.createdAt) * 100) / 100,
      supportWeight: Math.round(supportWeight * 100) / 100,
      sourceTitle: evidence.practiceActivity?.title ?? "Evidence"
    };
  });

  const eligible = inspected.filter((item) => item.eligibleForDemonstration);
  const bestCandidate = eligible.length ? Math.max(...eligible.map((item) => item.candidateLevel as number)) : null;
  const bestEvidence = bestCandidate === null ? [] : eligible.filter((item) => item.candidateLevel === bestCandidate);
  const bestStatusRank = bestEvidence.length ? Math.max(...bestEvidence.map((item) => statusRank[item.status] ?? 1)) : 0;
  const bestScore = bestEvidence.length ? Math.max(...bestEvidence.map((item) => item.score ?? 0)) : 0;
  const hasValidatedEvidence = bestEvidence.some((item) => (statusRank[item.status] ?? 1) >= 3);
  const hasVerifiedEvidence = bestEvidence.some((item) => item.verified === true && (statusRank[item.status] ?? 1) >= 4);
  const aiScores = bestEvidence.filter((item) => item.status === "AI assessed").map((item) => item.score ?? 0);
  const aiConsistency = aiScores.length >= 2 && Math.max(...aiScores) - Math.min(...aiScores) <= 15;
  const masteryEstablished = bestCandidate !== null
    && bestScore >= 75
    && (hasValidatedEvidence || aiConsistency);
  const demonstratedLevel = bestCandidate;
  const verifiedLevel = hasVerifiedEvidence ? bestCandidate : null;
  const validationStatus = bestEvidence.length
    ? evidenceStatuses[Math.max(...bestEvidence.map((item) => (statusRank[item.status] ?? 1) - 1))]
    : "No evidence";
  const quality = inspected.some((item) => item.quality === "strong")
    ? inspected.filter((item) => item.quality === "strong").length >= 2 ? "strong and consistent" : "strong but provisional"
    : inspected.some((item) => item.quality === "moderate") ? "moderate" : inspected.length ? "weak" : "none";
  const effectiveLevel = demonstratedLevel ?? input.observedLevel;
  const progressToTarget = Math.min(100, Math.round((effectiveLevel / Math.max(input.targetLevel, 1)) * 100));
  const gap = Math.max(0, input.targetLevel - effectiveLevel);
  const nextAction = !eligible.length
    ? "Produce and submit a Capability-linked work sample for assessment."
    : !masteryEstablished
      ? "Add a second independent production or obtain human validation; one AI assessment is provisional."
      : demonstratedLevel !== null && demonstratedLevel < input.targetLevel
        ? `Produce evidence at level ${input.targetLevel} (${masteryScale[input.targetLevel - 1]?.name ?? "target"}).`
        : hasVerifiedEvidence
          ? "Maintain the demonstrated practice and review the next complex situation."
          : bestStatusRank >= 3
            ? "Request MissionPro verification if a verified level is required."
            : "Request human validation before treating this level as established.";

  return {
    observedLevel: input.observedLevel,
    observedLevelLabel: formatLevel(input.observedLevel),
    demonstratedLevel,
    demonstratedLevelLabel: formatLevel(demonstratedLevel),
    demonstratedState: masteryEstablished ? "established" : demonstratedLevel === null ? "not_established" : "provisional",
    verifiedLevel,
    verifiedLevelLabel: formatLevel(verifiedLevel),
    targetLevel: input.targetLevel,
    targetLevelLabel: formatLevel(input.targetLevel),
    capabilityGap: gap,
    progressToTarget,
    evidenceCount: input.evidence.length,
    eligibleEvidenceCount: eligible.length,
    evidenceQuality: quality,
    validationStatus,
    requiresValidation: bestEvidence.length === 0 || !hasVerifiedEvidence,
    masteryEstablished,
    mostRecentRelevantAssessment: inspected.length
      ? [...inspected].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null,
    nextRecommendedAction: nextAction,
    supportingEvidence: inspected,
    explanation: [
      "The Passport does not average scores. It selects the highest Capability activity level supported by rubric coverage and assessment quality.",
      "Scores below 60 or coverage below 50% do not establish a level; scores from 60–74 or partial coverage support one level below the activity level.",
      "A single AI-assessed production is provisional. A level becomes established only with validated evidence or at least two consistent AI-assessed productions.",
      "Difficulty, recency and provenance affect support weight, but cannot promote an evidence item beyond its activity level.",
      hasVerifiedEvidence ? "A verified level is shown only when the supporting Evidence status is MissionPro verified or Externally certified." : "No verified level is established by the current Evidence."
    ]
  };
}

export async function getCapabilityPassport(userId: string) {
  const [capabilities, levels] = await Promise.all([
    db.capability.findMany({
      where: { status: "active" },
      orderBy: { code: "asc" },
      include: {
        userCapabilities: { where: { userId } },
        diagnosticSessions: { where: { userId }, orderBy: { createdAt: "desc" }, take: 1 },
        evidence: {
          where: { userId },
          orderBy: { createdAt: "desc" },
          include: {
            practiceActivity: { select: { type: true, title: true, masteryLevel: true } }
          }
        }
      }
    }),
    db.masteryLevel.findMany({ orderBy: { levelNumber: "asc" }, select: { levelNumber: true, name: true, description: true } })
  ]);

  return {
    masteryScale: levels.length ? levels : masteryScale,
    governance: evidenceStatuses,
    notice: "Demonstrated mastery is evidence-based and explainable. AI assessed is not verified or certified.",
    capabilities: capabilities.map((capability) => {
      const profile = capability.userCapabilities[0];
      const diagnostic = capability.diagnosticSessions[0];
      const observedLevel = profile?.observedLevel ?? diagnostic?.observedLevel ?? 1;
      const targetLevel = profile?.targetLevel ?? diagnostic?.targetLevel ?? capability.targetLevel ?? 3;
      const aggregation = aggregateCapabilityMastery({
        observedLevel,
        targetLevel,
        evidence: capability.evidence.map((evidence) => ({
          id: evidence.id,
          score: evidence.score?.toString() ?? null,
          status: evidence.status,
          provenance: evidence.provenance,
          assessorType: evidence.assessorType,
          verified: evidence.verified,
          humanValidation: evidence.humanValidation,
          createdAt: evidence.createdAt,
          practiceActivity: evidence.practiceActivity,
          criteriaSnapshot: evidence.criteriaSnapshot,
          aiAssessment: evidence.aiAssessment
        }))
      });
      return {
        capability: { id: capability.id, code: capability.code, name: capability.name, description: capability.description },
        ...aggregation
      };
    })
  };
}