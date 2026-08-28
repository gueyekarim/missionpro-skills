# MissionPro Skills + NOVA — MVP Product Requirements Document

## Product
- Product: MissionPro Skills
- Intelligent layer: NOVA
- Target: MVP v0.1
- Primary user: professional learner

## Core user story
En tant que professionnel, je veux indiquer ce que je souhaite être capable de faire afin que NOVA structure la capacité, évalue mon niveau, construise un parcours adapté, m'accompagne dans l'apprentissage et la pratique, évalue mes productions et conserve les preuves démontrant ma maîtrise.

## MVP Epics
### 1. Capability Builder
Une intention formulée en langage naturel devient une fiche de capacité structurée : titre, description, domaine, outcomes, skills, connaissances, tâches, niveaux, critères de réussite et preuves possibles. Actions : Accept, Edit, Regenerate.

### 2. Diagnostic
Combiner auto-évaluation, questions, mini-cas et production courte. Produire observed level, target level, gap et justification explicable.

### 3. Personal Capability Path
Générer un parcours adaptatif : Foundations → Guided Practice → Independent Practice → Simulation → Evidence.

### 4. NOVA Tutor
NOVA reçoit un Context Contract contenant au minimum utilisateur, capability, niveau observé, niveau cible, unité actuelle, évaluations précédentes et preuves.

### 5. Practice Lab
Modes MVP : Learn, Practice, Challenge. Les activités doivent être contextualisées et rattachées à une capacité.

### 6. NOVA Assessor
Évaluer les productions à partir d'une rubrique explicite et produire score, strengths, weaknesses, missing evidence, next action et mastery recommendation.

### 7. Evidence Portfolio
Une production évaluée peut être sauvegardée comme preuve avec capacité, critères, score, date, provenance et mode d'évaluation.

### 8. Capability Passport
Afficher les capacités en développement et démontrées, les preuves, le niveau actuel, le niveau cible et la prochaine action recommandée.

## Business rules
1. La Capability est l'objet central, pas le cours.
2. Toute Learning Unit doit être reliée à au moins une Capability.
3. Toute Evidence doit être reliée à une Capability.
4. Toute Evidence possède une provenance identifiable.
5. La maîtrise ne dépend pas uniquement de l'auto-évaluation.
6. NOVA explique ses évaluations.
7. L'utilisateur peut demander une nouvelle évaluation.
8. AI assessment et human validation restent distinguables.
9. Le Capability Passport reflète les preuves disponibles.
10. La progression peut modifier automatiquement le parcours.

## AI governance levels
Self-declared → AI assessed → Human validated → MissionPro verified → Externally certified.

## Reference acceptance scenario MP-001
Utilisateur : chef de projet public.
Objectif : « Être capable d'identifier et prioriser les risques d'un projet public. »

Le système doit :
1. créer la Capability ;
2. identifier ses composantes ;
3. diagnostiquer l'utilisateur ;
4. déterminer niveau actuel et cible ;
5. générer le parcours ;
6. enseigner une notion avec NOVA ;
7. proposer un cas pratique ;
8. recevoir la production ;
9. l'évaluer avec une rubric ;
10. enregistrer la preuve ;
11. mettre à jour la maîtrise ;
12. afficher le résultat dans le Capability Passport.

Le MVP est accepté lorsque cette boucle fonctionne de bout en bout de manière persistante et reproductible.
