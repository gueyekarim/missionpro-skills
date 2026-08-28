# MissionPro Skills — Sprint 0 Acceptance Checklist

Use this checklist to decide whether Replit may proceed to Sprint 1.

## Gate A — Application foundation
- [ ] Application starts without runtime errors after documented setup.
- [ ] Main application shell is reachable.
- [ ] Protected area requires authentication.
- [ ] Sign in and sign out work.
- [ ] User record is persisted in PostgreSQL.

**Fail condition:** any blocking startup, authentication or persistence error.

## Gate B — Database foundation
- [ ] PostgreSQL connection works.
- [ ] Migrations run successfully on a clean database.
- [ ] Core MVP tables exist: users, capabilities, skills, capability_skills, mastery_levels, learning_units, assessments, evidence, user_capabilities, agents.
- [ ] Foreign-key relationships are valid.
- [ ] Seed process is repeatable.
- [ ] Five mastery levels are present.
- [ ] Reference capability `CAP-PROJ-RISK-001` is present.

**Fail condition:** schema cannot be reproduced from migrations and seed data.

## Gate C — Capability-first architecture
- [ ] `Capability` is the central domain object.
- [ ] No `Course` object has replaced Capability as the organizing core.
- [ ] Learning, evidence and mastery structures can reference a capability.
- [ ] Product code does not embed speculative LMS logic inconsistent with the Blueprint.

**Fail condition:** implementation drifts toward a conventional course-first LMS.

## Gate D — NOVA foundation
- [ ] NOVA exists as one server-side Orchestrator/service.
- [ ] Architecture supports specialized modes without deploying multiple independent agents.
- [ ] AI/provider configuration is centralized.
- [ ] At least one controlled server-side NOVA smoke test works or is mock-tested.
- [ ] Structured AI outputs can be schema-validated.
- [ ] Context Contract type/object exists and is extensible.

**Fail condition:** model calls are scattered across UI code or client-side components.

## Gate E — Security
- [ ] AI/API credentials never reach browser/client bundles.
- [ ] Secrets are not committed to Git.
- [ ] Environment variables are documented.
- [ ] Startup validates required environment configuration.
- [ ] Authenticated routes are protected.
- [ ] External/AI structured data is validated before domain use.
- [ ] Database access uses ORM/parameterized queries.

**Fail condition:** any API key or secret is exposed client-side or committed.

## Gate F — Navigation and scope discipline
- [ ] Minimal navigation shell exists for Home, Capabilities, My Path, NOVA, Practice, Evidence and Passport, or an equivalent restrained structure.
- [ ] Only Sprint 0 functionality is implemented beyond placeholders.
- [ ] No marketplace has been added.
- [ ] No payments/storefront have been added.
- [ ] No community/social feed has been added.
- [ ] No gamification/badge system has been added.
- [ ] No multi-agent simulation has been added.
- [ ] No Organization Mode has been implemented prematurely.

**Fail condition:** substantial effort was diverted to deferred features.

## Gate G — Tests and reproducibility
- [ ] Health check passes.
- [ ] Database connectivity check passes.
- [ ] Migration check passes.
- [ ] Seed verification passes.
- [ ] Auth smoke test passes where practical.
- [ ] NOVA automated tests do not require live paid AI calls.
- [ ] Replit provides clear test results and known limitations.

**Fail condition:** Replit claims completion without reproducible checks.

## Gate H — Documentation
- [ ] Developer setup instructions are current.
- [ ] Required environment variables are listed without secret values.
- [ ] Migration and seed commands are documented.
- [ ] Replit completion report lists changed files.
- [ ] Known limitations are explicit.
- [ ] Report confirms Sprint 1 was not started.

## Decision rule

### PASS
All critical Gates A–E and G pass. Minor documentation or UI-shell issues may be corrected before Sprint 1.

### CONDITIONAL PASS
Core architecture is sound but small non-security defects remain. Correct them before Sprint 1 and rerun checks.

### FAIL
Any of the following requires correction before Sprint 1:
- secrets exposed;
- database not reproducible;
- Capability-first architecture violated;
- NOVA implemented client-side or as uncontrolled scattered calls;
- authentication/persistence fundamentally broken;
- no verifiable tests;
- major deferred features implemented instead of Sprint 0 foundation.

## Approval output
When reviewing Replit, produce one of:

- `SPRINT 0 — PASS: Approved for Sprint 1.`
- `SPRINT 0 — CONDITIONAL PASS: Fix listed items before Sprint 1.`
- `SPRINT 0 — FAIL: Do not start Sprint 1.`

Then list the evidence for the decision and the exact corrective actions, if any.