# Prompt 09 — MP-001 Golden Path End-to-End Validation

Do not add major product features in this stage. Validate and repair the existing MVP loop.

Use `docs/GOLDEN_PATH.md` as the authoritative scenario.

## Reference persona
Amadou — public project manager.

## Goal
`Être capable d’identifier et prioriser les risques d’un projet public.`

## Validate the complete loop
1. User enters the goal.
2. NOVA structures the capability.
3. User accepts/saves it.
4. Diagnostic determines observed level and gap.
5. Personal Capability Path is generated.
6. User learns with contextual NOVA.
7. User completes a relevant practice/challenge.
8. NOVA Assessor evaluates against explicit rubric.
9. User can save the production as evidence.
10. Evidence persists with provenance.
11. Mastery state updates according to evidence rules.
12. Capability Passport reflects the result and traceability.
13. The next recommended action is coherent with remaining gaps.

## Test expectations
Create automated tests for deterministic domain behavior and integration boundaries. Mock AI where appropriate. Add a manual E2E checklist for AI-dependent behavior.

Test unhappy paths: invalid AI output, model/provider failure, unauthorized access, missing evidence, failed persistence and reassessment.

## Deliverable
Provide an E2E matrix with each Golden Path step marked PASS / FAIL, evidence of the test, defects fixed and remaining blockers.

STOP. Do not introduce new scope.
