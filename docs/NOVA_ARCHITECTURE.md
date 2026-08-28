# NOVA — Architecture v2.0

## Role
NOVA est l'intelligence pédagogique et d'accompagnement de MissionPro Skills. NOVA ne doit pas agir comme un chatbot générique : ses interventions sont contextualisées par le Capability Registry, le profil de l'utilisateur, son niveau, son parcours et ses preuves.

## Target agent model
- NOVA Architect — construit les parcours.
- NOVA Tutor — enseigne et explique.
- NOVA Coach — accompagne la progression.
- NOVA Simulator — crée et anime les situations professionnelles.
- NOVA Assessor — évalue les productions.
- NOVA Evidence — qualifie et organise les preuves.
- NOVA Mentor — recommande le développement futur.
- NOVA Work — accompagne l'application dans le travail réel.

## MVP implementation
Ne pas déployer huit infrastructures agentiques séparées. Utiliser un **NOVA Orchestrator** avec des modes spécialisés :

- architect
- diagnostician
- tutor
- practice
- assessor
- mentor

Chaque mode dispose d'un prompt, de règles et de sorties structurées propres.

## Context Contract
Avant une intervention significative, NOVA doit pouvoir récupérer :
- user identity/profile ;
- role/context ;
- current capability ;
- observed mastery level ;
- target mastery level ;
- current learning unit ;
- recent assessments ;
- evidence available ;
- weaknesses/gaps ;
- recommended next action.

Le contrat répond à six questions : Who are you? What are you trying to become capable of doing? Where are you now? Where must you get to? What have you demonstrated? What should happen next?

Sprint 3B enrichit le contrat avec les données utiles au tutorat :
- skills, connaissances, tâches observables et preuves attendues de la Capability ;
- Personal Capability Path et activité courante ;
- événements pédagogiques récents sans contenu conversationnel ;
- question ou tâche courante, utilisée uniquement pendant la requête.

Le mode `tutor` produit une réponse structurée validée couvrant explication, questionnement, exemple, raisonnement guidé, feedback, exercice court, application professionnelle et prochaine action. Les modes d'expérience `LEARN`, `ASK NOVA` et `MY WORK` passent tous par le même orchestrateur serveur.

## Structured AI outputs
Les appels destinés à créer ou modifier des objets métier doivent utiliser des sorties structurées validables (JSON/schema) plutôt qu'un texte libre. Les évaluations doivent conserver rubric, critères, scores, justification, limites et recommandation.

## Governance
NOVA ne confond pas évaluation IA et certification. Statuts : Self-declared, AI assessed, Human validated, MissionPro verified, Externally certified.

## Evidence Engine

Sprint 5A transforme uniquement une production professionnelle déjà évaluée en Evidence, sur choix
explicite du learner. La preuve conserve l’activité, la production, l’assessment choisi, la rubric,
le score, l’assessor, le statut et la provenance. Les tentatives de réévaluation restent accessibles
depuis la submission source.

`AI assessed` ne devient jamais automatiquement `Human validated`, `MissionPro verified` ou
`Externally certified`. L’existence d’une Evidence ne modifie pas silencieusement la maîtrise.

## Future direction
Le NOVA Orchestrator pourra évoluer vers un système multi-agents avec simulations interactives, outils professionnels, RAG sur corpus MissionPro et accompagnement continu Learn → Practice → Work → Evidence.
