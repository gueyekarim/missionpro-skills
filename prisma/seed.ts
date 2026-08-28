import { PrismaClient } from "@prisma/client";
import { MASTERY_LEVELS, REFERENCE_CAPABILITY } from "../src/domain/mastery";

const db = new PrismaClient();

async function main() {
  for (const level of MASTERY_LEVELS) {
    await db.masteryLevel.upsert({
      where: { levelNumber: level.levelNumber },
      update: {
        name: level.name,
        description: level.description,
        observableBehaviors: [...level.observableBehaviors],
        minimumEvidence: level.minimumEvidence,
        assessmentRules: { requiresAssessment: level.levelNumber > 1, minEvidence: level.minimumEvidence }
      },
      create: {
        levelNumber: level.levelNumber,
        name: level.name,
        description: level.description,
        observableBehaviors: [...level.observableBehaviors],
        minimumEvidence: level.minimumEvidence,
        assessmentRules: { requiresAssessment: level.levelNumber > 1, minEvidence: level.minimumEvidence }
      }
    });
  }

  const capability = await db.capability.upsert({
    where: { code: REFERENCE_CAPABILITY.code },
    update: {
      name: REFERENCE_CAPABILITY.name,
      description: REFERENCE_CAPABILITY.description,
      domain: REFERENCE_CAPABILITY.domain,
      capabilityType: REFERENCE_CAPABILITY.capabilityType,
      purpose: REFERENCE_CAPABILITY.purpose,
      businessOutcome: REFERENCE_CAPABILITY.businessOutcome,
      successCriteria: [...REFERENCE_CAPABILITY.successCriteria],
      context: REFERENCE_CAPABILITY.context,
      criticality: REFERENCE_CAPABILITY.criticality,
      targetLevel: REFERENCE_CAPABILITY.targetLevel,
      evidenceRequirements: [...REFERENCE_CAPABILITY.evidenceRequirements]
    },
    create: {
      code: REFERENCE_CAPABILITY.code,
      name: REFERENCE_CAPABILITY.name,
      description: REFERENCE_CAPABILITY.description,
      domain: REFERENCE_CAPABILITY.domain,
      capabilityType: REFERENCE_CAPABILITY.capabilityType,
      purpose: REFERENCE_CAPABILITY.purpose,
      businessOutcome: REFERENCE_CAPABILITY.businessOutcome,
      successCriteria: [...REFERENCE_CAPABILITY.successCriteria],
      context: REFERENCE_CAPABILITY.context,
      criticality: REFERENCE_CAPABILITY.criticality,
      targetLevel: REFERENCE_CAPABILITY.targetLevel,
      evidenceRequirements: [...REFERENCE_CAPABILITY.evidenceRequirements]
    }
  });

  const skillSeeds = [
    ["RISK-CONTEXT", "Analyser le contexte du projet", "analysis"],
    ["RISK-QUALIFICATION", "Qualifier probabilité et impact", "analysis"],
    ["RISK-PRIORITIZATION", "Prioriser et justifier les réponses", "decision"]
  ] as const;
  for (const [code, name, category] of skillSeeds) {
    const skill = await db.skill.upsert({
      where: { code },
      update: { name, category, skillType: "professional" },
      create: { code, name, category, skillType: "professional" }
    });
    await db.capabilitySkill.upsert({
      where: { capabilityId_skillId: { capabilityId: capability.id, skillId: skill.id } },
      update: { weight: 1, requiredLevel: 3 },
      create: { capabilityId: capability.id, skillId: skill.id, weight: 1, requiredLevel: 3 }
    });
  }

  const learningUnit = await db.learningUnit.upsert({
    where: { id: "2c9d6f5c-bc14-4e7a-9d0d-000000000001" },
    update: {},
    create: {
      id: "2c9d6f5c-bc14-4e7a-9d0d-000000000001",
      title: "Lire une matrice de risques de projet public",
      type: "foundation",
      objective: "Relier contexte, probabilité, impact, criticité et réponse.",
      difficulty: 2,
      estimatedDuration: 30
    }
  });
  await db.capabilityLearningUnit.upsert({
    where: { capabilityId_learningUnitId: { capabilityId: capability.id, learningUnitId: learningUnit.id } },
    update: { targetLevel: 3 },
    create: { capabilityId: capability.id, learningUnitId: learningUnit.id, targetLevel: 3 }
  });

  const assessment = await db.assessment.upsert({
    where: { id: "2c9d6f5c-bc14-4e7a-9d0d-000000000002" },
    update: {},
    create: {
      id: "2c9d6f5c-bc14-4e7a-9d0d-000000000002",
      title: "Matrice de risques contextualisée — MP-001",
      assessmentType: "professional_case",
      rubric: {
        criteria: ["pertinence des risques", "qualité de la qualification", "justification de la priorité", "réponse proposée"],
        scoring: "0-5 par critère"
      },
      passingScore: 70
    }
  });
  await db.capabilityAssessment.upsert({
    where: { capabilityId_assessmentId: { capabilityId: capability.id, assessmentId: assessment.id } },
    update: { masteryLevel: 3 },
    create: { capabilityId: capability.id, assessmentId: assessment.id, masteryLevel: 3 }
  });

  await db.agent.upsert({
    where: { name: "NOVA Orchestrator" },
    update: {
      role: "Intelligence pédagogique et d’accompagnement",
      agentType: "orchestrator",
      status: "active",
      systemPrompt: "Centralized server-side orchestrator. Specialized modes: architect, diagnostician, tutor, practice, assessor, mentor."
    },
    create: {
      name: "NOVA Orchestrator",
      role: "Intelligence pédagogique et d’accompagnement",
      agentType: "orchestrator",
      status: "active",
      systemPrompt: "Centralized server-side orchestrator. Specialized modes: architect, diagnostician, tutor, practice, assessor, mentor."
    }
  });

  console.log(`Seed complete: ${MASTERY_LEVELS.length} mastery levels, ${capability.code}, NOVA Orchestrator`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());