"use client";

import { useEffect, useState } from "react";

type Assessment = {
  id: string; overallScore: number; criterionScores: Array<{ label: string; score: number; maxScore: number; rationale: string }>;
  strengths: string[]; weaknesses: string[]; missingElements: string[]; feedback: string;
  recommendedNextAction: string; masteryRecommendation: string | null; provenance: string; status: string;
  createdAt: string; contestReason?: string | null;
};
type Evidence = {
  id: string; title: string; description: string | null; producedWork: string | null;
  source: { type: string; title: string; objective: string; expectedOutput: string; skillCode: string | null } | null;
  assessment: Assessment | null; assessmentHistory: Assessment[]; criteria: unknown;
  score: string | null; assessorType: string; status: string; provenance: string;
  verified: boolean; validationRequired: boolean; createdAt: string;
};
type Group = { capability: { code: string; name: string }; evidence: Evidence[] };
type Portfolio = { governance: string; statuses: string[]; groups: Group[] };

export function EvidencePortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/evidence")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Impossible de charger le portfolio.");
        setPortfolio(payload);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Impossible de charger le portfolio."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="notice">Evidence Portfolio charge les productions évaluées…</p>;
  if (error) return <p className="notice error-notice" role="alert">{error}</p>;
  if (!portfolio?.groups.length) return <section className="hero"><p className="eyebrow">Evidence Portfolio</p><h1>Your demonstrated work belongs here.</h1><p>Aucune Evidence sauvegardée. Soumettez une production évaluée depuis Practice Lab, puis choisissez Save this work as evidence.</p></section>;

  return <div className="evidence-page">
    <section className="hero evidence-hero"><p className="eyebrow">Sprint 5A · Evidence Engine</p><h1>Evidence Portfolio</h1><p>Vos productions évaluées, regroupées par Capability et reliées à leur activité, rubric, score, provenance et historique de réévaluation.</p><div className="provenance-ladder">{portfolio.statuses.map((status, index) => <span className={index === 1 ? "active" : ""} key={status}>{status}</span>)}</div><strong className="evidence-governance">{portfolio.governance}</strong></section>
    {portfolio.groups.map((group) => <section className="evidence-group" key={group.capability.code}><div className="section-heading"><div><p className="eyebrow">{group.capability.code}</p><h2>{group.capability.name}</h2></div><span className="pill">{group.evidence.length} evidence</span></div>{group.evidence.map((evidence) => <EvidenceCard evidence={evidence} key={evidence.id} />)}</section>)}
  </div>;
}

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  return <article className="card evidence-card">
    <div className="section-heading"><div><p className="eyebrow">{evidence.source?.type ?? "professional production"} · {evidence.provenance}</p><h3>{evidence.title}</h3></div><div className="evidence-score">{evidence.score ?? "—"}<span>/100</span></div></div>
    <div className="evidence-status-row"><span className="pill status-pill">{evidence.status}</span><span className="pill">{evidence.assessorType} assessor</span>{evidence.validationRequired && <span className="validation-needed">Further validation required</span>}</div>
    {evidence.source && <div className="evidence-source"><strong>Capability activity</strong><p>{evidence.source.title} · {evidence.source.objective}</p><small>Expected output: {evidence.source.expectedOutput}</small></div>}
    <div className="evidence-production"><strong>Produced work</strong><p>{evidence.producedWork}</p></div>
    {evidence.assessment && <div className="evidence-assessment"><strong>Assessment trace · {evidence.assessment.status}</strong><div className="evidence-criteria">{evidence.assessment.criterionScores.map((criterion) => <span key={criterion.label}>{criterion.label}: {criterion.score}/{criterion.maxScore}</span>)}</div><p>{evidence.assessment.feedback}</p><small>Next action: {evidence.assessment.recommendedNextAction}</small></div>}
    {evidence.assessmentHistory.length > 1 && <details><summary>Assessment history ({evidence.assessmentHistory.length} attempts)</summary>{evidence.assessmentHistory.map((attempt) => <p key={attempt.id}>{attempt.createdAt} · {attempt.overallScore}/100 · {attempt.status}</p>)}</details>}
    <small className="muted">Saved {new Date(evidence.createdAt).toLocaleString()}</small>
  </article>;
}