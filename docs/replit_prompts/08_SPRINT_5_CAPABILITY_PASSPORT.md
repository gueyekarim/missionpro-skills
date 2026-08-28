# Prompt 08 — Sprint 5B: Capability Passport

Proceed only after Evidence Engine acceptance.

## Objective
Create a credible, evidence-backed view of what the user can demonstrably do.

Build the Capability Passport showing at minimum:
- capabilities in development;
- capabilities with demonstrated evidence;
- observed/current mastery;
- target mastery;
- evidence count/strength summary;
- verification status;
- last assessment/update.

A capability must be clickable to show the evidence and assessment trail supporting the displayed level.

Mastery must not be inferred from course completion alone. It should derive from the rules defined in the data model and evidence/assessment record.

Where evidence is insufficient, say so explicitly.

Add the first MVP metric where practical:
**Demonstrated Capability Rate (DCR) = demonstrated target capabilities / target capabilities × 100.**

## MP-001
After valid evidence is stored, the Passport must update `CAP-PROJ-RISK-001` transparently and show why the current level is assigned.

Run tests for authorization, mastery update and traceability.
STOP. Do not add organization dashboards or marketplace features.
