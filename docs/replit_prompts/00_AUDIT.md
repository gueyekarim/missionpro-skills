# Prompt 00 — Repository Audit

Read the complete MissionPro Skills repository before changing code.

Treat the product documentation as the source of truth, especially README.md and all relevant files under docs/.

## Task
1. Inspect the current application architecture, dependencies, routes, database code, authentication, AI integration, tests and configuration.
2. Compare the implementation with BLUEPRINT.md, PRD.md, DATA_MODEL.md, NOVA_ARCHITECTURE.md, MVP_ROADMAP.md and GOLDEN_PATH.md.
3. Identify what already exists, what is incomplete, what conflicts with the product doctrine and what is missing for Sprint 0.
4. Check whether any existing code is useful and should be preserved rather than rewritten.
5. Identify technical risks, security issues, duplicated concepts and premature features.

## Required report
Return:
- Current architecture
- Existing features
- Existing database/schema
- Existing NOVA/AI implementation
- Existing authentication
- Existing tests
- Gaps against Sprint 0
- Product-doctrine conflicts
- Security concerns
- Recommended Sprint 0 implementation plan

Do not modify code during this audit.
Do not start Sprint 0 automatically.
STOP after the audit report.
