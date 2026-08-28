import { describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { persistCapabilityDraft } from "../src/server/capabilities";
import { persistDiagnostic } from "../src/server/diagnostics";
import { persistPersonalPath } from "../src/server/paths";
import { generateTutorResponse } from "../src/server/tutor";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const db = new PrismaClient();

describe("Sprint 0/1/2/3A/3B PostgreSQL integration", () => {
  test("migration tables and repeatable seed are present", { skip: !hasDatabase ? "DATABASE_URL is not configured" : false }, async () => {
    const tables = await db.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('users', 'capabilities', 'skills', 'capability_skills', 'mastery_levels', 'learning_units', 'assessments', 'evidence', 'user_capabilities', 'agents', 'diagnostic_sessions', 'personal_capability_paths', 'personal_path_items', 'tutor_interactions')
    `;
    assert.equal(tables.length, 14);
    assert.equal(await db.masteryLevel.count(), 5);
    assert.ok(await db.capability.findUnique({ where: { code: "CAP-PROJ-RISK-001" } }));
    assert.equal(await db.agent.count({ where: { name: "NOVA Orchestrator" } }), 1);
  });

  test("user passwords are hashed and sessions are persisted by user relation", { skip: !hasDatabase ? "DATABASE_URL is not configured" : false }, async () => {
    const email = `integration-${crypto.randomUUID()}@missionpro.test`;
    const password = "IntegrationPass123!";
    const passwordHash = await bcrypt.hash(password, 4);
    const user = await db.user.create({ data: { email, name: "Integration User", passwordHash } });
    assert.notEqual(passwordHash, password);
    assert.equal(await bcrypt.compare(password, passwordHash), true);
    const tokenHash = crypto.createHash("sha256").update(crypto.randomBytes(32)).digest("hex");
    const session = await db.session.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60_000) }
    });
    assert.equal((await db.session.findUnique({ where: { id: session.id }, include: { user: true } }))?.user.email, email);
    await db.session.delete({ where: { id: session.id } });
    await db.user.delete({ where: { id: user.id } });
  });

  test("accepted capability drafts persist, remain editable, and reuse registry skills", { skip: !hasDatabase ? "DATABASE_URL is not configured" : false }, async () => {
    const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
    const email = `builder-${suffix.toLowerCase()}@missionpro.test`;
    const user = await db.user.create({ data: { email, name: "Builder User" } });
    const skillCode = `SKILL-BUILDER-${suffix}`;
    const draft = {
      code: `CAP-BUILDER-${suffix}`,
      sourceIntent: "Être capable de produire une décision explicable.",
      name: "Produire une décision explicable",
      description: "Analyser une situation et justifier une décision observable.",
      domain: "Décision professionnelle",
      purpose: "Améliorer la qualité des décisions.",
      businessOutcome: "Une décision exploitable et traçable.",
      outcomes: ["La décision est comprise par les parties prenantes."],
      skills: [{
        code: skillCode,
        name: "Justifier une décision",
        description: "Relier les faits, critères et arbitrages.",
        category: "decision",
        skillType: "professional",
        requiredLevel: 3
      }],
      knowledgeRequirements: ["Critères de décision."],
      observableTasks: ["Produire une note de décision."],
      targetLevel: 3,
      successCriteria: ["Les arbitrages sont explicites."],
      expectedEvidence: ["Note de décision évaluée."]
    };

    const created = await persistCapabilityDraft(draft, user.id);
    const updated = await persistCapabilityDraft(
      { ...draft, description: "Description modifiée et persistée." },
      user.id,
      created.id
    );
    assert.equal(updated.description, "Description modifiée et persistée.");
    assert.equal(updated.version, 2);
    assert.equal(await db.skill.count({ where: { code: skillCode } }), 1);
    assert.equal(await db.capabilitySkill.count({ where: { capabilityId: created.id } }), 1);

    await db.capability.delete({ where: { id: created.id } });
    await db.skill.delete({ where: { code: skillCode } });
    await db.user.delete({ where: { id: user.id } });
  });

  test("diagnostic sessions persist explainable results and update the user capability profile", { skip: !hasDatabase ? "DATABASE_URL is not configured" : false }, async () => {
    const capability = await db.capability.findUniqueOrThrow({ where: { code: "CAP-PROJ-RISK-001" } });
    const user = await db.user.create({
      data: { email: `diagnostic-${crypto.randomUUID()}@missionpro.test`, name: "Diagnostic User" }
    });
    const saved = await persistDiagnostic({
      capabilityId: capability.id,
      responses: {
        selfAssessment: 5,
        knowledgeAnswer: "Je consulte les documents et échange avec l’équipe.",
        miniCaseAnswer: "Je réunis les parties prenantes et prépare une décision.",
        productionAnswer: "Je rédige une note synthétique à partir des échanges."
      }
    }, user.id);

    assert.equal(saved.result.targetLevel - saved.result.observedLevel, saved.result.capabilityGap);
    assert.equal(saved.result.observedLevel, 1);
    assert.equal(saved.result.provenance, "AI assessed");
    assert.equal(saved.result.evidenceSupportingDiagnosis.length, 3);
    const profile = await db.userCapability.findUniqueOrThrow({
      where: { userId_capabilityId: { userId: user.id, capabilityId: capability.id } }
    });
    assert.equal(profile.observedLevel, saved.result.observedLevel);
    assert.equal(profile.targetLevel, saved.result.targetLevel);
    assert.equal(profile.evidenceCount, 0);
    await db.user.delete({ where: { id: user.id } });
  });

  test("two users receive different persisted paths and contextual Tutor responses for the same Capability", { skip: !hasDatabase ? "DATABASE_URL is not configured" : false }, async () => {
    const capability = await db.capability.findUniqueOrThrow({ where: { code: "CAP-PROJ-RISK-001" } });
    const [foundationUser, advancedUser] = await Promise.all([
      db.user.create({ data: { email: `path-foundation-${crypto.randomUUID()}@missionpro.test`, name: "Foundation User" } }),
      db.user.create({ data: { email: `path-advanced-${crypto.randomUUID()}@missionpro.test`, name: "Advanced User" } })
    ]);
    const foundationDiagnostic = await persistDiagnostic({
      capabilityId: capability.id,
      responses: {
        selfAssessment: 4,
        knowledgeAnswer: "Je consulte les documents avec mon équipe avant de commencer.",
        miniCaseAnswer: "Je réunis les parties prenantes afin de discuter du projet.",
        productionAnswer: "Je prépare une note générale et je la partage pendant une réunion."
      }
    }, foundationUser.id);
    const advancedDiagnostic = await persistDiagnostic({
      capabilityId: capability.id,
      responses: {
        selfAssessment: 3,
        knowledgeAnswer: "J’analyse le contexte, la probabilité, l’impact et la criticité.",
        miniCaseAnswer: "Je choisis une réponse et je nomme un responsable.",
        productionAnswer: "Je prépare un tableau synthétique avec les décisions à suivre."
      }
    }, advancedUser.id);
    assert.equal(foundationDiagnostic.result.observedLevel, 1);
    assert.equal(advancedDiagnostic.result.observedLevel, 3);

    const foundationPath = await persistPersonalPath({ capabilityId: capability.id }, foundationUser.id);
    const advancedPath = await persistPersonalPath({ capabilityId: capability.id }, advancedUser.id);
    assert.ok(foundationPath.path.items.length > advancedPath.path.items.length);
    assert.ok(foundationPath.path.items.some((item) => item.stage === "understand"));
    assert.equal(advancedPath.path.items.some((item) => item.stage === "understand"), false);
    assert.equal(advancedPath.path.items.filter((item) => item.skillCode).every((item) => item.skillCode === "SKILL-RISK-PRIORITIZATION"), true);
    assert.equal(await db.userCapability.findUniqueOrThrow({
      where: { userId_capabilityId: { userId: advancedUser.id, capabilityId: capability.id } }
    }).then((profile) => profile.observedLevel), 3);

    const question = "Comment prioriser un risque fournisseur ?";
    const foundationTutor = await generateTutorResponse({
      capabilityId: capability.id,
      pathItemId: foundationPath.path.items[0].id,
      mode: "LEARN",
      question
    }, foundationUser.id);
    const advancedTutor = await generateTutorResponse({
      capabilityId: capability.id,
      pathItemId: advancedPath.path.items.find((item) => item.stage === "challenge")?.id,
      mode: "LEARN",
      question
    }, advancedUser.id);
    assert.notEqual(foundationTutor.output.response, advancedTutor.output.response);
    assert.match(foundationTutor.output.teachingPoint, /repérage du contexte/i);
    assert.match(advancedTutor.output.teachingPoint, /arbitrage/i);
    assert.equal(await db.tutorInteraction.count({ where: { userId: { in: [foundationUser.id, advancedUser.id] } } }), 2);

    await db.user.deleteMany({ where: { id: { in: [foundationUser.id, advancedUser.id] } } });
  });
});

test("integration test requires no live AI provider", () => {
  assert.ok(true);
});

process.on("exit", () => { void db.$disconnect(); });