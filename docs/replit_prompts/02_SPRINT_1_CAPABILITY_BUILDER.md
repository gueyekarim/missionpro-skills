# Prompt 02 — Sprint 1: Capability Registry & Builder

Proceed only if Sprint 0 has been accepted.

MissionPro Skills is capability-first. The primary entry question is:

**What do you want to be able to do? / Que devez-vous être capable de réaliser ?**

## Build
Implement the first complete Capability Registry and Capability Builder experience.

A user enters a natural-language capability goal such as:
`Être capable d’identifier et prioriser les risques d’un projet public.`

NOVA Architect must propose a structured Capability Record containing at minimum:
- code
- name
- description
- domain
- purpose/business outcome
- skills
- knowledge requirements where supported
- observable tasks
- target mastery level
- success criteria
- expected evidence

Provide Accept / Edit / Regenerate behavior. Persist accepted capabilities and relationships.

Create a Capability Profile screen that clearly shows the capability structure and five mastery levels.

## Architecture
Use the existing NOVA Orchestrator in architect mode. AI calls remain server-side. Validate structured outputs before persistence. Do not duplicate skills unnecessarily: reuse registry skills where appropriate.

## Acceptance test
MP-001 must transform the reference sentence into a persistent, editable Capability Record with associated skills and target mastery.

## Do not build
Diagnostic, adaptive learning, full tutor, practice lab, evidence portfolio, passport, organization mode or marketplace.

Run tests and report implementation evidence.
STOP after Sprint 1. Do not start Sprint 2.
