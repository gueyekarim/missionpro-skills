import { db } from "../src/lib/db";
import { getServerConfig } from "../src/lib/config";
import { MASTERY_LEVELS, REFERENCE_CAPABILITY } from "../src/domain/mastery";

async function main() {
  getServerConfig();
  await db.$queryRaw`SELECT 1`;
  const [levels, capability, tableRows] = await Promise.all([
    db.masteryLevel.findMany({ orderBy: { levelNumber: "asc" }, select: { levelNumber: true, name: true } }),
    db.capability.findUnique({ where: { code: REFERENCE_CAPABILITY.code }, select: { code: true, name: true } }),
    db.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('users', 'capabilities', 'skills', 'capability_skills', 'mastery_levels', 'learning_units', 'assessments', 'evidence', 'user_capabilities', 'agents')
      ORDER BY tablename
    `
  ]);
  const expected = new Set(MASTERY_LEVELS.map((level) => `${level.levelNumber}:${level.name}`));
  const actual = new Set(levels.map((level) => `${level.levelNumber}:${level.name}`));
  if (expected.size !== actual.size || [...expected].some((entry) => !actual.has(entry))) {
    throw new Error("Mastery seed verification failed");
  }
  if (!capability) throw new Error("Reference capability seed verification failed");
  if (tableRows.length < 10) throw new Error(`Expected 10 MVP tables, found ${tableRows.length}`);
  console.log(JSON.stringify({
    database: "connected",
    tables: tableRows.map((row) => row.tablename),
    masteryLevels: levels,
    referenceCapability: capability
  }, null, 2));
}

main()
  .catch((error) => {
    console.error("Database check failed", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());