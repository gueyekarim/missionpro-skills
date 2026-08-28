# MissionPro Skills — MVP Roadmap

## Goal
Valider une boucle complète de développement capacitaire avant d'ajouter marketplace, paiement, communauté ou fonctions marketing avancées.

## Sprint 0 — Foundation
- architecture application ;
- PostgreSQL ;
- authentication ;
- navigation ;
- design system minimal ;
- NOVA Orchestrator ;
- configuration AI sécurisée ;
- migrations et données seed.

**Exit:** application démarre, utilisateur peut se connecter, base persiste, NOVA répond via une couche serveur contrôlée.

## Sprint 1 — Capability Registry
- Capability Builder ;
- Capability Profile ;
- Skills ;
- mastery levels ;
- Accept/Edit/Regenerate.

**Exit:** une phrase devient une Capability persistante et éditable.

## Sprint 2 — Diagnostic
- diagnostic session ;
- questions et mini-cas ;
- observed level ;
- target level ;
- capability gap ;
- justification NOVA.

**Exit:** un utilisateur possède un profil capacitaire initial explicable.

## Sprint 3A — Personal Capability Path
- génération du Personal Capability Path ;
- learning units ;
- progression ;

**Exit:** un diagnostic devient un parcours personnel enregistré, ciblé sur les gaps et distinct de la maîtrise.

## Sprint 3B — NOVA Tutor
- NOVA Tutor contextualisé par le Context Contract ;
- modes LEARN, ASK NOVA et MY WORK ;
- réponses structurées adaptées au niveau et à l’étape du parcours ;
- événements pédagogiques minimaux sans stockage du contenu conversationnel.

**Exit:** NOVA enseigne à partir du niveau réel et du parcours enregistré.

## Sprint 4 — Practice + Assessment
- Practice Lab ;
- Challenge ;
- submission ;
- rubric ;
- NOVA Assessor ;
- feedback et recommendation.

**Exit:** une production peut être évaluée avec critères explicites.

## Sprint 5A — Evidence Engine + Portfolio
- sauvegarde de la preuve ;
- Evidence Portfolio ;
- trace assessment, rubric et reassessment ;
- gouvernance de provenance ;
- aucune promotion automatique de maîtrise.

**Exit:** une production MP-001 évaluée peut devenir, sur choix explicite, une Evidence traçable et visible par Capability.

## Sprint 5B — Capability Passport
- agrégation evidence-aware en lecture seule ;
- Capability Passport ;
- observed / demonstrated / verified / target ;
- explication des Evidence contributrices ;
- next action sans mutation silencieuse.

**Exit:** le Passport répond à ce qui a été réellement démontré, au niveau soutenu par les preuves et au degré de validation.

## Deferred after MVP
Organization Mode complet, simulations multi-agents, payments, storefront, community, marketing automation, affiliate system, native mobile applications et marketplace.

## Golden path MP-001
« Être capable d'identifier et prioriser les risques d'un projet public » → Capability → Diagnostic → Path → NOVA Tutor → Challenge → Assessment → Evidence → Mastery → Passport.
