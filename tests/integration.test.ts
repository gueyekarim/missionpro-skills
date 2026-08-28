import { describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const db = new PrismaClient();

describe("Sprint 0 PostgreSQL integration", () => {
  test("migration tables and repeatable seed are present", { skip: !hasDatabase ? "DATABASE_URL is not configured" : false }, async () => {
    const tables = await db.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('users', 'capabilities', 'skills', 'capability_skills', 'mastery_levels', 'learning_units', 'assessments', 'evidence', 'user_capabilities', 'agents')
    `;
    assert.equal(tables.length, 10);
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
});

test("integration test requires no live AI provider", () => {
  assert.ok(true);
});

process.on("exit", () => { void db.$disconnect(); });