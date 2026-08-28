# MissionPro Skills — Capability & Skill Registry Data Model

## Principle
Le modèle est centré sur la capacité et la preuve. Le graphe logique est :

Organization → Mission → Outcome → Capability → Skills / Knowledge / Tasks / Roles / Learning Units / Simulations / Assessments / Agents / Workflows → User → Evidence → Mastery.

## Core entities
### capabilities
id, code, source_intent, name, description, domain, capability_type, purpose, business_outcome, outcomes, knowledge_requirements, observable_tasks, success_criteria, context, criticality, target_level, evidence_requirements, version, status, created_by, created_at, updated_at.

### skills
id, code, name, description, category, skill_type.

### knowledge_items
id, code, title, description, domain, source_type.

### tasks
id, code, name, description, task_type, complexity_level.

### roles
id, code, name, description, role_family.

### mastery_levels
id, level_number, name, description, observable_behaviors, minimum_evidence, assessment_rules.

### learning_units
id, title, type, objective, difficulty, estimated_duration.

### assessments
id, title, assessment_type, rubric, passing_score.

### evidence
id, user_id, capability_id, task_id, assessment_id, evidence_type, title, description, artifact_url, artifact_text, score, assessor_type, assessor_id, ai_assessment, human_validation, verified, created_at.

### user_capabilities
user_id, capability_id, observed_level, target_level, confidence_score, evidence_count, last_assessed_at.

### agents
id, name, role, system_prompt, agent_type, status.

## Junction entities
capability_skills(capability_id, skill_id, weight, required_level)

capability_tasks(capability_id, task_id, importance_weight)

capability_roles(capability_id, role_id, required_level)

capability_learning_units(capability_id, learning_unit_id, target_level)

capability_assessments(capability_id, assessment_id, mastery_level)

capability_agents(capability_id, agent_id, function)

## Later organizational entities
organizations, missions, outcomes, outcome_capabilities, simulations, capability_simulations, workflows, organization_capabilities.

## Mastery scale
1. Awareness — expliquer et reconnaître.
2. Assisted Practice — réaliser avec assistance.
3. Autonomous Practice — réaliser seul dans les situations courantes.
4. Advanced Practice — traiter des situations complexes et conseiller.
5. System Mastery — concevoir, transmettre et gouverner le dispositif.

## MVP database scope
Première implémentation : users, capabilities, skills, capability_skills, mastery_levels, learning_units, assessments, evidence, user_capabilities, agents.

## Core invariant
Une progression de maîtrise doit être traçable jusqu'aux évaluations et preuves qui la justifient. L'auto-évaluation seule ne peut produire un statut de maîtrise vérifiée.
