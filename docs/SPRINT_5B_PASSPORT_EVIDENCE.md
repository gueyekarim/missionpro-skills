# Sprint 5B Evidence — Capability Passport

## Scope

Implemented only the Capability Passport and evidence-based mastery aggregation defined by Prompt
08. Golden Path, QA/Release and Organization Mode remain excluded.

## Aggregation rules

The Passport is a read-only projection. It does not update UserCapability or Evidence.

1. Activity completion and Self-declared Evidence cannot establish demonstrated mastery.
2. Evidence with score below 60 or rubric coverage below 50% establishes no level.
3. Evidence with score 60–74 or partial rubric coverage supports one level below the activity.
4. Evidence with score at least 75 and at least 75% rubric coverage can support the activity level.
5. Evidence never supports a level above the assessed activity’s mastery level.
6. One AI-assessed production is provisional, regardless of score.
7. Two AI-assessed productions at the same candidate level establish consistency only when their
   scores are within 15 points.
8. Human-validated Evidence can establish demonstrated mastery but not a verified level.
9. Only MissionPro-verified or externally certified Evidence can establish verified mastery.
10. Difficulty, recency and provenance affect visible support weight but never override the gates.

## MP-001 states

| State | Evidence | Passport result |
|---|---|---|
| Weak/incomplete | 0/100 AI assessed | Demonstrated level not established |
| Strong AI assessed | 93/100 MP-001 challenge | Activity level shown as provisional; verified level absent |
| Human validated fixture | 93/100 with human validation | Activity level established; verified level still absent |

The two practice users completed the same MP-001 challenge flow but received different Passport
states because their produced and assessed Evidence differed.

## Explainability

Each Capability card shows:

- observed, demonstrated, verified and target levels;
- Evidence count and number eligible to support a level;
- quality and strongest validation state;
- progress and gap;
- latest relevant assessment;
- next recommended action;
- aggregation rules;
- every Evidence contribution, including candidate level, score, rubric coverage, difficulty,
  recency and governance status.

## Governance

- AI assessed never appears as MissionPro verified or externally certified.
- Human validated does not populate verified mastery.
- No course, activity completion, self-declaration or isolated score silently promotes mastery.
- NOVA-style next actions are recommendations only.

## Validation

| Check | Result |
|---|---|
| Clean PostgreSQL migrations `0001` → `0007` | PASS |
| Repeatable seed | PASS |
| Full automated suite | 49 passed, 0 failed, 0 skipped |
| Passport contract tests | 7 passed |
| Authenticated weak / strong AI / human / verified scenarios | PASS |
| User isolation and Evidence traceability | PASS |
| Observed level remains unchanged | PASS |
| Prisma schema and TypeScript | PASS |
| Credential scan | PASS |
| Production build and `/app/passport` route | PASS |

The build retains one non-blocking Autoprefixer compatibility warning already present in the shared
stylesheet; compilation, type checking and static generation complete successfully.