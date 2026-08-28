export const MASTERY_LEVELS = [
  {
    levelNumber: 1,
    name: "Awareness",
    description: "Expliquer et reconnaître les concepts et situations essentiels.",
    observableBehaviors: ["reconnaît les concepts", "explique les éléments principaux"],
    minimumEvidence: 0
  },
  {
    levelNumber: 2,
    name: "Assisted Practice",
    description: "Réaliser une tâche avec une assistance explicite.",
    observableBehaviors: ["suit une méthode guidée", "produit avec feedback rapproché"],
    minimumEvidence: 1
  },
  {
    levelNumber: 3,
    name: "Autonomous Practice",
    description: "Réaliser seul la capacité dans les situations courantes.",
    observableBehaviors: ["choisit une méthode adaptée", "livre un résultat exploitable seul"],
    minimumEvidence: 2
  },
  {
    levelNumber: 4,
    name: "Advanced Practice",
    description: "Traiter des situations complexes et conseiller d'autres personnes.",
    observableBehaviors: ["gère la complexité", "conseille et justifie ses arbitrages"],
    minimumEvidence: 3
  },
  {
    levelNumber: 5,
    name: "System Mastery",
    description: "Concevoir, transmettre et gouverner le dispositif de capacité.",
    observableBehaviors: ["conçoit le système", "transmet et gouverne la capacité"],
    minimumEvidence: 4
  }
] as const;

export const REFERENCE_CAPABILITY = {
  code: "CAP-PROJ-RISK-001",
  name: "Identifier et prioriser les risques d’un projet public",
  description:
    "Analyser le contexte d’un projet public, identifier ses risques, les qualifier et prioriser les réponses de manière explicable.",
  domain: "Gestion de projet public",
  capabilityType: "professional",
  purpose: "Éclairer les décisions de pilotage par une lecture structurée des risques.",
  businessOutcome: "Réduire les surprises et sécuriser l’atteinte des résultats du projet.",
  successCriteria: [
    "identifier les risques pertinents à partir du contexte",
    "évaluer probabilité, impact et criticité",
    "prioriser les risques avec une justification",
    "proposer une réponse et un responsable"
  ],
  context: { persona: "chef de projet public", reference: "MP-001" },
  criticality: "high",
  targetLevel: 4,
  evidenceRequirements: ["matrice de risques contextualisée", "rubric d’évaluation explicite"]
} as const;

export const PROVENANCE_TYPES = [
  "Self-declared",
  "AI assessed",
  "Human validated",
  "MissionPro verified",
  "Externally certified"
] as const;