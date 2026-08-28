# MissionPro Skills — UX Flows

## Primary individual journey

**Need → Capability → Diagnose → Learn → Practice → Prove → Master → Apply**

## Screen 1 — Capability Home
Question centrale : **What do you want to be able to do?**

L’utilisateur saisit une intention en langage naturel. Exemple : « Identifier et prioriser les risques d’un projet public. »

## Screen 2 — NOVA Capability Builder
NOVA structure l’intention en capability : description, domaine, outcomes, skills, knowledge, tasks, mastery levels, success criteria et evidence requirements. L’utilisateur peut accepter, modifier ou régénérer.

## Screen 3 — Diagnostic
Le diagnostic combine auto-évaluation, questions, mini-cas et production courte. Il produit un niveau observé, un niveau cible, un gap et une explication.

## Screen 4 — Personal Capability Path
Le parcours est généré depuis le dernier diagnostic, les gaps, les signaux observés et les skills de la Capability. Il est organisé autour de : Understand → Learn → Practice → Simulate → Apply → Prove → Master, en omettant les étapes déjà démontrées. Chaque activité possède un output et une condition de complétion. La progression peut être suivie, mais la complétion ne constitue jamais une preuve de maîtrise.

## Screen 5 — NOVA Tutor
Trois espaces : Learn, Ask NOVA et My Work. NOVA utilise le Context Contract : utilisateur, rôle, capability, niveau observé, cible, historique, preuves et tâche courante.

Le serveur complète ce contexte avec les skills, le dernier diagnostic, le Personal Capability Path et l’activité courante. NOVA retourne une explication, un point d’apprentissage, une question, un exemple, un raisonnement guidé, un feedback, un exercice court, une connexion au travail et la prochaine action. Le Tutor n’enregistre pas le texte de la conversation et ne produit ni preuve, ni évaluation formelle, ni changement de maîtrise.

## Screen 6 — Practice Lab
Modes MVP : Guided Exercise, Professional Case, Challenge, Short Simulation et Real Work. Le learner doit produire un livrable. NOVA Assessor applique une rubric visible, conserve les scores par critère et permet contestation ou réévaluation. La complétion seule n’est jamais évaluée.

## Screen 7 — Evidence & Assessment
Une production est évaluée avec une rubric explicite. L’utilisateur peut ensuite choisir **Save this work as evidence**. L’Evidence Portfolio regroupe les preuves par Capability et montre la production, la source, les critères, le score, l’assessor, la provenance, le statut, l’historique de réévaluation et le besoin de validation. Une Evidence AI assessed n’est ni certifiée ni automatiquement convertie en maîtrise vérifiée.

## Screen 8 — Capability Passport
Affiche les capacités en développement et démontrées, niveaux observés et cibles, nombre et qualité des preuves, dernière évaluation et prochaine action recommandée.

## Organization Mode — post-MVP
Question d’entrée : **What must your organization be able to do?**

Chaîne : Strategic Outcome → Required Organizational Capabilities → Roles → People → Observed Capabilities → Gaps → Development Actions → Evidence → Performance.

## MVP navigation
- Capabilities
- My Path
- Learn
- Practice
- Evidence
- Passport
- NOVA

## UX rule
Le système doit toujours rendre visible où l’utilisateur se trouve dans la boucle Capability → Evidence → Mastery.