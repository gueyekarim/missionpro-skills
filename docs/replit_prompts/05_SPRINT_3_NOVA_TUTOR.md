# Prompt 05 — Sprint 3B: NOVA Tutor

Proceed only after the Personal Capability Path is accepted.

## Objective
Build NOVA as a contextual capability-development tutor, not a generic chatbot.

NOVA Tutor must receive a server-built Context Contract containing, where available:
- user profile;
- role/context;
- current capability;
- observed level;
- target level;
- current learning unit;
- recent assessments;
- evidence summary;
- known weaknesses/gaps;
- next recommended action;
- current task.

The Tutor experience should support three conceptual modes:
- LEARN
- ASK NOVA
- MY WORK

NOVA should explain concepts, question the learner, adapt difficulty, connect explanations to the user's professional context and avoid teaching material already demonstrated unless remediation is needed.

Persist appropriate learning/progression events without storing unnecessary sensitive conversation content.

## Guardrails
AI calls server-side only. Validate tool/structured outputs. Do not present AI assessment as certification. Keep one NOVA Orchestrator; do not create a fleet of independent agents.

## MP-001
NOVA should tutor the learner specifically on gaps revealed in public-project risk prioritization.

Run tests and report evidence.
STOP. Do not start Practice/Assessment automatically.
