# MissionPro Skills — Sprint 2 Evidence Report

**Scope:** Diagnostic Engine only.  
**Reference:** `CAP-PROJ-RISK-001` / MP-001.  
**Recommendation:** `SPRINT 2 — PASS`.  
**Sprint 3:** not started.

## Diagnostic method

The diagnostic uses four declared methods:

1. structured self-assessment, retained as context but excluded from demonstrated-level scoring;
2. knowledge question against explicit Capability criteria;
3. professional mini-case against explicit decision criteria;
4. short production against observable task criteria.

The three observable activities are scored server-side. Their signals determine an observed level
between 1 and the Capability target. NOVA diagnostician receives the Capability, criteria, scores and
observed signals, then returns a schema-validated explanation, strengths, weaknesses, missing evidence
and development priorities.

The server rejects a NOVA result that violates:

```text
Required / Target Capability − Observed Capability = Capability Gap
```

## MP-001 acceptance evidence

The authenticated HTTP acceptance used a deliberately high self-assessment and weaker demonstrated
answers to prove that self-assessment does not set the result:

```text
capability: CAP-PROJ-RISK-001
methods:
  - structured_self_assessment
  - knowledge_question
  - mini_case
  - short_production
selfAssessment: 5
observedLevel: 2
targetLevel: 4
capabilityGap: 2
invariant: 4 - 2 = 2
evidence sources:
  - knowledge_question
  - mini_case
  - short_production
provenance: AI assessed
reviewable persisted session: PASS
```

## Persistence

- The complete diagnostic session is linked to `User` and `Capability`.
- Methods, responses, observed signals, result, explanation and provenance are persisted.
- `user_capabilities` is updated with observed level, target level, confidence and assessment date.
- The record remains AI-assessed; no verified or certified mastery is granted.

## Checks

| Check | Result |
|---|---|
| Clean PostgreSQL migration `0001` → `0002` → `0003` | PASS |
| Seed executed twice | PASS |
| Eleven required tables and MP-001 | PASS |
| Automated tests with PostgreSQL | 21 passed, 0 failed, 0 skipped |
| Sprint 2 contract tests | 5 passed |
| Diagnostic persistence integration | PASS |
| Authenticated MP-001 HTTP flow | PASS |
| TypeScript | PASS |
| Next.js production build | PASS |
| Client credential scan | PASS |

## Known limitations

- Signal scoring uses explicit deterministic criteria; broader semantic scoring depends on the configured real AI provider.
- The diagnostic is an initial capability profile, not a certification or final mastery assessment.
- Repeated diagnostics are stored, but longitudinal comparison visualization is not included.
- The short production is text-only in Sprint 2; file-based evidence belongs to later evidence work.
- Learning Path, NOVA Tutor, Practice, Evidence Portfolio and Passport remain deferred.