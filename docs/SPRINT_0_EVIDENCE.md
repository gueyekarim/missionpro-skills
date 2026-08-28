# MissionPro Skills — Sprint 0 Evidence Report

**Scope:** technical foundation only.  
**Decision:** `SPRINT 0 — PASS`  
**Sprint 1:** not started.

## Evidence

| Gate | Result | Evidence |
|---|---|---|
| A — Application | PASS | Next.js production build; protected `/app`; signup, sign-in, sign-out and post-sign-out redirect smoke-tested |
| B — Database | PASS | Clean PostgreSQL migration; 10 required MVP tables; seed run twice; five mastery levels and `CAP-PROJ-RISK-001` verified |
| C — Capability-first | PASS | `Capability` is the central domain object; no `Course` model; learning units, assessments and evidence reference capabilities |
| D — NOVA | PASS | One server-side `NovaOrchestrator`; six modes; Context Contract; Zod output validation; mock provider tests |
| E — Security | PASS | AI configuration is server-only; HttpOnly sessions; hashed passwords; client secret scan passes; no committed secret values |
| F — Scope | PASS | Restrained navigation placeholders only; no marketplace, payment, community, gamification, organization mode or multi-agent simulation |
| G — Reproducibility | PASS | `npm test`, TypeScript, build, migration, seed, database check, health and NOVA smoke checks executed |
| H — Documentation | PASS | README, environment example, migration/seed commands and known limitations documented |

## Commands used

```text
npm test
npx tsc --noEmit
npm run build
npx prisma migrate deploy
npm run db:seed
npm run db:check
npm run test:integration
npm run security:check
```

Automated tests use the NOVA mock provider and do not require a paid AI request.
Integration checks require `DATABASE_URL`; without it they are explicitly skipped rather
than falsely reported as passed.

Last local verification:

- `npm test`: **9 passed, 0 failed** with PostgreSQL configured;
- `npm run test:integration`: **3 passed, 0 failed**;
- `npm run security:check`: **passed**, 17 application files scanned;
- `npx tsc --noEmit`: **passed**;
- clean database: migration applied, seed repeated twice, `db:check` passed.

## Known limitations

- The production PostgreSQL instance and real AI provider must be configured by deployment.
- Organization Mode, Capability Builder, Diagnostic, Learning Path, Practice Lab, Evidence Portfolio,
  Capability Passport and multi-agent simulation remain deferred.
- Full browser E2E automation is not part of Sprint 0; the authentication flow has a documented HTTP smoke test.