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

## Sprint 0 — démarrage développeur

Le dépôt contient le socle Sprint 0 : application Next.js/TypeScript, PostgreSQL via Prisma,
authentification individuelle par session HttpOnly, navigation protégée et NOVA Orchestrator
server-side. Les pages Capabilities, My Path, NOVA, Practice, Evidence et Passport sont des
placeholders de navigation ; elles ne constituent pas encore le Capability Builder, le diagnostic,
le Practice Lab ou le Passport des sprints suivants.

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

### Socle extensible

Les contenus de blog, modules et MOOC futurs seront traités comme des ressources pédagogiques
reliées à des capacités et à des preuves, et non comme une nouvelle architecture course-first.
Le professeur reste un architecte et un garant humain ; l’évaluation IA conserve une provenance
distincte de la validation humaine, de la vérification MissionPro et d’une certification externe.
