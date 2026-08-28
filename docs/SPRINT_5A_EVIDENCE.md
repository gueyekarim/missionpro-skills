# Sprint 5A Evidence — Evidence Engine and Portfolio

## Scope

Implemented only the Evidence Engine and Evidence Portfolio from
`docs/replit_prompts/07_SPRINT_5_EVIDENCE.md`.

Capability Passport and subsequent prompts remain deferred.

## Invariants

```text
Activity ≠ Evidence
Completion ≠ Evidence
Assessment ≠ Certification
Evidence = observable production + Capability + criteria + assessment + provenance
```

Only an owned PracticeSubmission with at least one structured assessment can be saved. Saving is an
explicit learner action. No path-item completion, PracticeActivity or unassessed production creates
Evidence.

## Traceability

Each practice-derived Evidence stores or references:

- user and Capability;
- optional skill/component;
- PracticeActivity and its type;
- PracticeSubmission and produced work;
- selected PracticeAssessmentAttempt;
- rubric/criteria snapshot;
- score and AI assessment result;
- assessor type;
- governance status and provenance;
- validation requirement;
- creation timestamp.

The source submission retains all assessment attempts. The Portfolio exposes this reassessment
history and identifies the selected assessment attempt.

## Governance

Supported statuses:

```text
Self-declared → AI assessed → Human validated → MissionPro verified → Externally certified
```

Practice-derived evidence is saved as `AI assessed`, `verified = false`, and
`validationRequired = true`. The Evidence Engine contains no route that promotes it to a higher
status and does not update `UserCapability.observedLevel`.

## MP-001 demonstration

The authenticated flow was:

```text
MP-001 Challenge
→ Produced Work
→ NOVA Assessment
→ Save this work as evidence
→ Evidence record
→ Capability-grouped Portfolio
```

Weak and strong challenge productions were both eligible after assessment:

| Evidence | Score | Portfolio interpretation |
|---|---:|---|
| Weak production | 0/100 | Missing all six rubric dimensions; remediation required |
| Strong production | 93/100 | Five strong dimensions and partial prioritization; human review may be appropriate |

Both remain `AI assessed`, unverified and in need of further validation.

An Exercise activity with no submitted and assessed production created zero Evidence records.
Cross-user capture was rejected. The strong submission’s two assessment attempts remained visible
in the Portfolio.

## Checks

| Check | Result |
|---|---|
| Clean PostgreSQL migration `0001` → `0007` | PASS |
| Seed executed twice | PASS |
| Seventeen required tables and MP-001 | PASS |
| Automated tests with PostgreSQL | 42 passed, 0 failed, 0 skipped |
| Sprint 5A contract tests | 5 passed |
| Weak and strong Evidence persistence | PASS |
| Cross-user authorization | PASS |
| Reassessment history traceability | PASS |
| No completion-only Evidence | PASS |
| No automatic mastery update | PASS |
| TypeScript | PASS |
| Client credential scan | PASS |

## Known limitations

- Human validation, MissionPro verification and external certification workflows are represented by
  governance states but not executed in Sprint 5A.
- Produced text is stored because it is the observable artifact being preserved as Evidence.
- Evidence uses one record per source submission; saving again selects the latest assessment while
  retaining all attempts on the source submission.
- Capability Passport and organization analytics are not implemented.