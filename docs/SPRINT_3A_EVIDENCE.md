# MissionPro Skills — Sprint 3A Evidence Report

**Scope:** Personal Capability Path only.  
**Reference:** `CAP-PROJ-RISK-001` / MP-001.  
**Recommendation:** `SPRINT 3A — PASS`.  
**NOVA Tutor, Practice Lab and Evidence Portfolio:** not started.

## What was implemented

- Protected `Your Path to Mastery` experience at `/app/path`.
- Path generation from the selected Capability and the user’s latest persisted diagnostic.
- Structured NOVA Mentor output through the existing single server-side orchestrator.
- Persistent personal paths and ordered path items.
- Progress states: `not_started`, `in_progress`, `completed`.
- Review and regeneration from a selected or latest diagnostic.
- Explicit UI and data distinction between path completion and mastery.

## Path-generation logic

Generation uses:

- Capability definition, knowledge requirements, observable tasks and expected evidence;
- associated Capability skills and required levels;
- observed level, target level and capability gap;
- diagnostic weaknesses, weak evidence dimensions, missing evidence and priorities;
- the user and role context supplied through the NOVA Context Contract.

The deterministic structural layer selects only stages justified by the demonstrated state:

- users at levels 1–2 receive foundations plus skill-specific learning and guided practice;
- users closer to the target skip foundations and focus on the higher-order skill still needed;
- a user already observed at target receives only proof and mastery-review stages;
- advanced targets add challenge/simulation;
- application, proof and mastery review remain tied to observable Capability outputs.

Every item stores:

- Capability reference and target level;
- diagnosed gap or mastery rationale;
- optional associated skill;
- development objective;
- activity;
- expected output;
- completion condition.

NOVA output is schema-validated. The server rejects changes to the source Capability, levels, gap
invariant, target, sequence uniqueness or skill references.

## MP-001 personalization evidence

Two authenticated users completed different diagnostics for the same
`CAP-PROJ-RISK-001` Capability:

| Profile | Observed → target | Gap | Items | Foundations | Skill focus |
|---|---:|---:|---:|---|---|
| Foundation profile | 1 → 4 | 3 | 11 | Included | Context, qualification and prioritization |
| Advanced profile | 3 → 4 | 1 | 6 | Skipped | Prioritization and justified responses only |

Foundation-profile stages:

```text
Understand → Learn → Practice → Challenge → Apply → Prove → Master
```

Advanced-profile stages:

```text
Learn → Practice → Challenge → Apply → Prove → Master
```

The advanced user was not assigned the foundational stage. All six advanced-path items carried the
Capability, gap rationale, objective, activity, expected output and completion condition.

## Progress evidence

An advanced-path item was changed to `completed` over the authenticated API and re-read successfully.
The path status became `in_progress`; the user’s observed Capability level remained 3. Completion did
not update mastery or create evidence.

## Database changes

Migration `0004_personal_capability_path` adds:

- `personal_capability_paths`;
- `personal_path_items`;
- user, Capability, diagnostic session and optional Learning Unit relations;
- indexes for per-user Capability history and ordered item uniqueness.

Diagnostic inputs, evidence and skills are snapshot on each path so generation remains explainable
after source records evolve.

## Checks

| Check | Result |
|---|---|
| Clean PostgreSQL migration `0001` → `0004` | PASS |
| Seed executed twice | PASS |
| Thirteen required tables and MP-001 | PASS |
| Automated tests with PostgreSQL | 27 passed, 0 failed, 0 skipped |
| Sprint 3A contract tests | 5 passed |
| Two-user personalization integration | PASS |
| Authenticated two-profile MP-001 HTTP flow | PASS |
| Progress persistence and review | PASS |
| TypeScript | PASS |
| Next.js production build | PASS |
| Client credential scan | PASS |

## Known limitations

- The deterministic selector uses diagnostic dimensions and explicit skill metadata; richer semantic
  matching depends on the configured real AI provider.
- Progress is activity tracking only and does not infer competence.
- NOVA Tutor, interactive Practice Lab and assessment execution are deliberately absent.
- Expected outputs are descriptions in Sprint 3A; artifact submission belongs to later evidence work.
- Regeneration creates path history rather than merging progress across versions.