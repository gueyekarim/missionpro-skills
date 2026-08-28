# Sprint 3B Evidence — NOVA Tutor

## Scope

Implemented only NOVA Tutor from `docs/replit_prompts/05_SPRINT_3_NOVA_TUTOR.md`.
Practice Lab, formal Assessment, Evidence Portfolio, Capability Passport and later prompts remain deferred.

## Tutor experience

The protected `/app/nova` experience supports:

- `LEARN`;
- `ASK NOVA`;
- `MY WORK`.

It shows the server-resolved Capability state before tutoring: observed and target levels, gap,
current path stage/activity, expected output and associated skills. Responses contain:

- contextual explanation and teaching point;
- a question for the learner;
- Capability-relevant examples;
- reasoning guidance;
- feedback;
- a short exercise;
- a professional-work connection;
- the next appropriate action;
- `AI assisted` provenance.

## NOVA Context Contract

The server constructs the contract from:

- authenticated user;
- role/Capability context;
- current Capability, associated skills, knowledge, observable tasks and expected evidence;
- observed and target mastery;
- latest diagnostic weaknesses, priorities and evidence;
- latest Personal Capability Path;
- selected or next incomplete path activity;
- optional Learning Unit;
- recent minimal tutoring events;
- current mode and question/task.

The browser does not construct the authoritative context and receives no provider credential or system
prompt.

## Server-side AI architecture

`NovaOrchestrator.runTutor` is a specialized mode of the existing single orchestrator. Both the mock
provider and OpenAI provider emit the same strict Tutor schema. Invalid provider output is rejected
before it reaches the user or persistence layer.

Prompts and provider calls remain in `src/server`. Tutor API routes require authentication and validate
Capability, path-item ownership and request shape.

## Minimal persistence

Migration `0005_nova_tutor` adds `tutor_interactions`. It records only:

- user, Capability and optional path/path-item references;
- mode and event action;
- observed and target levels;
- path stage and timestamp.

Questions, responses, messages, prompts and conversation content are deliberately not stored.

## MP-001 personalization evidence

Both learners asked:

> Comment prioriser un risque fournisseur dans mon projet public ?

| Profile | Observed → target | Current stage | Tutor focus | Exercise |
|---|---:|---|---|---|
| Foundation | 1 → 4 | Understand | Context, probability and impact | Build a mini risk record |
| Advanced | 3 → 4 | Challenge | Arbitration and proportional response justification | Defend two plausible prioritizations before choosing |

The responses, teaching points and exercises differed. The advanced learner was not retaught the
foundation sequence.

Authenticated acceptance also validated `LEARN`, `ASK NOVA` and `MY WORK`, and confirmed three
minimal Tutor events for the advanced profile without persisted conversation text.

## Checks

| Check | Result |
|---|---|
| Clean PostgreSQL migration `0001` → `0005` | PASS |
| Seed executed twice | PASS |
| Fourteen required tables and MP-001 | PASS |
| Automated tests with PostgreSQL | 32 passed, 0 failed, 0 skipped |
| Sprint 3B Tutor contract tests | 5 passed |
| Authenticated two-profile MP-001 Tutor flow | PASS |
| Three Tutor modes | PASS |
| Minimal event persistence | PASS |
| TypeScript | PASS |
| Next.js production build | PASS |
| Client credential scan | PASS |

## Known limitations

- Tutor responses are generated per request; conversation text is intentionally not persisted.
- Recent learning context consists of minimal event metadata, not conversational memory.
- The mock provider proves deterministic personalization; richer language depends on the configured
  server-side AI provider.
- Tutor feedback is developmental guidance, not a formal Assessment, mastery decision or certification.
- Practice Lab, Evidence Portfolio and Capability Passport are not implemented.