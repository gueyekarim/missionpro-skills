# MissionPro Skills

**Plateforme agentique de développement, apprentissage, évaluation, workflows et preuves de maîtrise des capacités.**

MissionPro Skills part d'une question centrale : **What do you want to be able to do?**

Au lieu de placer le cours au centre, la plateforme organise le développement autour de la **Capability** et de preuves observables de maîtrise.

## Core lifecycle

Mission → Results → Capabilities → Diagnostic → Learning → Practice → Simulation → Real Work → Evidence → Assessment → Mastery → Performance.

## NOVA

**NOVA** est l'intelligence pédagogique et d'accompagnement de MissionPro Skills. Pour le MVP, un NOVA Orchestrator assure plusieurs modes : architect, diagnostician, tutor, practice, assessor et mentor.

## MVP golden path

`I want to be able to...` → Capability Builder → Diagnostic → Personal Capability Path → NOVA Tutor → Practice/Challenge → Assessment → Evidence → Capability Passport.

Le scénario de référence est : **« Être capable d'identifier et prioriser les risques d'un projet public. »**

## Documentation

- [Blueprint v2.0](docs/BLUEPRINT.md)
- [MVP Product Requirements](docs/PRD.md)
- [Capability & Skill Registry Data Model](docs/DATA_MODEL.md)
- [NOVA Architecture](docs/NOVA_ARCHITECTURE.md)
- [MVP Roadmap](docs/MVP_ROADMAP.md)

## Product principle

> **Don't just learn it. Prove you can do it.**

MissionPro Skills vise à relier apprentissage, pratique, travail réel, preuves et performance, pour les individus puis les organisations.

## Sprint 1 — Capability Registry & Builder

La route protégée `/app/capabilities` transforme une intention professionnelle en fiche structurée
avec NOVA Architect. La fiche comprend outcomes, skills réutilisables, connaissances, tâches
observables, niveau cible, critères de réussite et preuves attendues. L’utilisateur peut la régénérer,
l’éditer puis l’accepter pour la persister dans le Capability Registry.

Le rapport de vérification Sprint 1 est disponible dans
[`docs/SPRINT_1_EVIDENCE.md`](docs/SPRINT_1_EVIDENCE.md).

## Sprint 2 — Diagnostic Engine

La route protégée `/app/diagnostic` combine auto-évaluation structurée, question de connaissances,
mini-cas et production courte. Les trois activités observables déterminent le niveau observé ;
l’auto-évaluation seule ne peut pas établir la maîtrise. NOVA diagnostician retourne une explication
structurée, les forces, faiblesses, preuves manquantes et priorités, avec l’invariant :

`Target Capability − Observed Capability = Capability Gap`.

Le rapport de vérification est disponible dans
[`docs/SPRINT_2_EVIDENCE.md`](docs/SPRINT_2_EVIDENCE.md).

## Sprint 3A — Personal Capability Path

La route protégée `/app/path` transforme le dernier diagnostic d’une Capability en parcours
personnel persistant. Chaque étape reste traçable jusqu’à la Capability, au gap ou critère de
maîtrise, à une skill, à un objectif, à une activité, à un output attendu et à une condition de
complétion. Les étapes déjà démontrées sont omises ; la complétion du parcours reste distincte de
la maîtrise, qui exige toujours preuves et évaluation.

Le rapport de vérification est disponible dans
[`docs/SPRINT_3A_EVIDENCE.md`](docs/SPRINT_3A_EVIDENCE.md).

## Démarrage développeur

Le dépôt conserve le socle Sprint 0 : application Next.js/TypeScript, PostgreSQL via Prisma,
authentification individuelle par session HttpOnly, navigation protégée et NOVA Orchestrator
server-side. Capabilities, Diagnostic et My Path sont fonctionnels ; NOVA Tutor, Practice, Evidence
et Passport restent des placeholders pour les sprints suivants.

### Prérequis

- Node.js 20+
- PostgreSQL 14+

Copier `.env.example` vers `.env` et renseigner `DATABASE_URL` et un `SESSION_SECRET` d’au moins
32 caractères. `AI_PROVIDER=mock` est le mode local et de test ; pour un fournisseur réel,
configurer sa clé uniquement dans l’environnement serveur (`OPENAI_API_KEY` n’est jamais une
variable `NEXT_PUBLIC_*`).

### Commandes

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:check
npm test
npm run dev
```

Le check HTTP est disponible sur `GET /api/health`. Une fois connecté, la page
`/app/status` vérifie également la base et expose le smoke-test NOVA contrôlé.

Le rapport de clôture et les preuves par Gate sont regroupés dans
[`docs/SPRINT_0_EVIDENCE.md`](docs/SPRINT_0_EVIDENCE.md). Les contrôles d’intégration PostgreSQL
et le scan de sécurité se lancent avec `npm run test:integration` et `npm run security:check`.

### Socle extensible

Les contenus de blog, modules et MOOC futurs seront traités comme des ressources pédagogiques
reliées à des capacités et à des preuves, et non comme une nouvelle architecture course-first.
Le professeur reste un architecte et un garant humain ; l’évaluation IA conserve une provenance
distincte de la validation humaine, de la vérification MissionPro et d’une certification externe.
