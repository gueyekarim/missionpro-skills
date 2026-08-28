# MissionPro Skills — Replit Sprint 0 Implementation Brief

## Purpose
Build only the technical foundation required for the MissionPro Skills MVP. Do not implement future-stage product features.

MissionPro Skills is a capability-first platform. The central lifecycle is:

**Mission → Outcome → Capability → Diagnosis → Learning → Practice → Evidence → Assessment → Mastery → Performance**

The first user-facing golden path will later be:

**I want to be able to... → Capability Builder → Diagnostic → Personal Capability Path → NOVA Tutor → Practice → Assessment → Evidence → Capability Passport**

Sprint 0 must create the foundation for that path, not implement the full path.

---

## Source of truth
Before coding, read and follow:

1. `README.md`
2. `docs/BLUEPRINT.md`
3. `docs/PRODUCT_PRINCIPLES.md`
4. `docs/PRD.md`
5. `docs/DATA_MODEL.md`
6. `docs/UX_FLOWS.md`
7. `docs/NOVA_ARCHITECTURE.md`
8. `docs/MVP_ROADMAP.md`
9. `docs/GOLDEN_PATH.md`

If implementation choices conflict with these documents, the product documentation wins unless explicitly changed.

---

## Sprint 0 objective
At the end of Sprint 0:

- the application starts reliably;
- a user can access the application and authenticate;
- PostgreSQL is connected and migrations run successfully;
- the minimal MVP schema exists;
- a server-side NOVA service can make one controlled AI call;
- AI credentials never reach the browser;
- the application has a minimal navigation shell;
- seed data exists for mastery levels and the MP-001 reference capability;
- basic health and integration checks pass.

Do not build the Capability Builder UI, Diagnostic engine, Practice Lab, Evidence Portfolio or Capability Passport yet except for placeholders needed to verify navigation.

---

## Preferred stack
Use the existing project stack if one already exists and is healthy. Do not rewrite working infrastructure unnecessarily.

If the repository contains no application stack yet, use:

- TypeScript
- React / Next.js for the web application
- Node.js server-side runtime
- PostgreSQL
- a mature ORM suitable for PostgreSQL
- schema validation for all AI structured outputs

Keep the architecture simple and portable.

---

## Required application structure
Create clear separation between:

- UI / routes
- domain models
- database access
- NOVA AI service
- validation schemas
- configuration / environment
- tests

NOVA calls must occur only on the server side.

Do not put product logic inside UI components when it belongs in domain or service layers.

---

## Initial database scope
Implement the MVP foundation tables described in `docs/DATA_MODEL.md`:

- `users`
- `capabilities`
- `skills`
- `capability_skills`
- `mastery_levels`
- `learning_units`
- `assessments`
- `evidence`
- `user_capabilities`
- `agents`

Use stable primary keys, timestamps and appropriate foreign keys.

The schema must preserve the invariant that capability mastery can later be traced to evidence and assessments.

Do not add dozens of speculative tables.

---

## Seed data
Add seed data for the five mastery levels:

1. Awareness
2. Assisted Practice
3. Autonomous Practice
4. Advanced Practice
5. System Mastery

Also seed the reference capability:

**Code:** `CAP-PROJ-RISK-001`

**Name:** Identifier et prioriser les risques d’un projet public

This capability is the MP-001 golden-path test case and must remain available for later sprints.

---

## Authentication
Implement the simplest secure authentication compatible with the existing stack.

Sprint 0 only needs:

- sign in / sign out;
- authenticated session;
- protected application area;
- user record linked to the database.

Do not build organization membership, teams, invitations, billing or social profiles yet.

---

## Minimal navigation shell
Create a restrained application shell with placeholders for:

- Home
- Capabilities
- My Path
- NOVA
- Practice
- Evidence
- Passport

Only Home and a simple system-status page need to be functional in Sprint 0.

Avoid premature gamification, badges, marketplace components, social feeds or complex dashboards.

---

## NOVA foundation
Implement one `NOVA Orchestrator` service rather than multiple independent agents.

Prepare support for modes:

- `architect`
- `diagnostician`
- `tutor`
- `practice`
- `assessor`
- `mentor`

For Sprint 0, only a technical smoke-test mode needs to call the model.

The service must:

- run server-side;
- receive explicit context;
- support structured outputs;
- validate structured output before returning it to product logic;
- handle model/API errors cleanly;
- log operational failures without logging secrets;
- keep model/provider configuration centralized.

Do not hard-code prompts throughout UI components.

---

## Context Contract foundation
Create a typed context object that can later contain:

- user profile
- role/context
- current capability
- observed mastery level
- target mastery level
- current learning unit
- recent assessments
- evidence available
- weaknesses/gaps
- recommended next action
- current task

Sprint 0 does not need to populate all fields. The structure must simply exist and be extensible.

---

## AI governance requirements
Preserve the distinction between:

- Self-declared
- AI assessed
- Human validated
- MissionPro verified
- Externally certified

Do not label any AI-generated result as certified.

All future assessment records must be able to identify their provenance.

---

## Security requirements
- AI/API keys remain server-side only.
- Do not commit secrets.
- Validate environment configuration at startup.
- Validate all external and AI-generated structured data.
- Use parameterized/ORM database access.
- Protect authenticated routes.
- Avoid storing unnecessary sensitive information.

---

## Required checks
Add at minimum:

1. application health check;
2. database connectivity check;
3. migration test;
4. authentication smoke test where practical;
5. NOVA server-side smoke test with a mocked provider for automated tests;
6. seed verification for mastery levels and `CAP-PROJ-RISK-001`.

The automated test suite should not require a live paid AI request.

---

## Definition of Done
Sprint 0 is complete only when:

- the app runs without setup errors after documented environment configuration;
- migrations can be executed from a clean database;
- seed data loads successfully;
- an authenticated user can reach the application shell;
- the database contains the MVP foundation entities;
- NOVA can be called through a server endpoint/service without exposing credentials;
- tests/checks pass;
- README or developer setup documentation explains how to run the application;
- no deferred feature has been unnecessarily implemented.

---

## Explicitly deferred
Do **not** implement in Sprint 0:

- full Capability Builder
- diagnostic engine
- adaptive learning path
- NOVA Tutor product experience
- Practice Lab
- multi-agent simulation
- Evidence Portfolio
- Capability Passport
- Organization Mode
- payments
- storefront
- marketplace
- community
- marketing automation
- affiliate system
- native mobile apps

---

## Final Replit report
When Sprint 0 is complete, return a concise implementation report containing:

1. what was built;
2. files/directories created or changed;
3. database schema/migrations added;
4. environment variables required;
5. tests run and results;
6. known limitations;
7. confirmation that deferred features were not implemented;
8. recommended first task for Sprint 1.

Do not start Sprint 1 automatically.
