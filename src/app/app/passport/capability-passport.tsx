"use client";

import { useEffect, useState } from "react";

type EvidenceSupport = {
  id: string; score: number | null; status: string; provenance: string; quality: string;
  candidateLevel: number | null; criterionCoverage: number; difficulty: string; difficultyFactor: number;
  recencyFactor: number; supportWeight: number; sourceTitle: string;
};
type CapabilityPassportItem = {
  capability: { code: string; name: string; description: string };
  observedLevel: number; observedLevelLabel: string; demonstratedLevel: number | null;
  demonstratedLevelLabel: string; demonstratedState: string; verifiedLevel: number | null;
  verifiedLevelLabel: string; targetLevel: number; targetLevelLabel: string; capabilityGap: number;
  progressToTarget: number; evidenceCount: number; eligibleEvidenceCount: number; evidenceQuality: string;
  validationStatus: string; requiresValidation: boolean; masteryEstablished: boolean;
  mostRecentRelevantAssessment: EvidenceSupport | null; nextRecommendedAction: string;
  supportingEvidence: EvidenceSupport[]; explanation: string[];
};
type Passport = { masteryScale: Array<{ levelNumber?: number; level?: number; name: string }>; governance: string[]; notice: string; capabilities: CapabilityPassportItem[] };

export function CapabilityPassport() {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/passport").then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Impossible de charger le Passport.");
      setPassport(payload);
    }).catch((caught) => setError(caught instanceof Error ? caught.message : "Impossible de charger le Passport."));
  }, []);

  if (error) return <p className="notice error-notice" role="alert">{error}</p>;
  if (!passport) return <p className="notice">Capability Passport assemble les preuves démontrées…</p>;
  return <div className="passport-page">
    <section className="hero passport-hero"><p className="eyebrow">Sprint 5 · Capability Passport</p><h1>What have you actually demonstrated?</h1><p>Le Passport distingue le niveau observé, le niveau démontré par la production et le niveau vérifié par une validation appropriée. Il ne mesure ni les cours terminés ni les scores seuls.</p><strong className="evidence-governance">{passport.notice}</strong><div className="provenance-ladder">{passport.governance.map((status, index) => <span className={index === 1 ? "active" : ""} key={status}>{status}</span>)}</div></section>
    {!passport.capabilities.length && <section className="hero"><h2>Aucune Capability active.</h2><p>Commencez par le Registry pour créer une Capability observable.</p></section>}
    {passport.capabilities.map((item) => <PassportCard key={item.capability.code} item={item} />)}
  </div>;
}

function PassportCard({ item }: { item: CapabilityPassportItem }) {
  return <section className="card passport-card">
    <div className="section-heading"><div><p className="eyebrow">{item.capability.code}</p><h2>{item.capability.name}</h2></div><span className={`pill passport-state ${item.demonstratedState}`}>{item.demonstratedState.replace("_", " ")}</span></div>
    <div className="passport-level-grid"><Level label="Observed" value={item.observedLevelLabel} /><Level label="Demonstrated" value={item.demonstratedLevelLabel} /><Level label="Verified" value={item.verifiedLevelLabel} /><Level label="Target" value={item.targetLevelLabel} /></div>
    <div className="passport-progress"><div className="section-heading"><strong>Progress toward target</strong><span>{item.progressToTarget}% · gap {item.capabilityGap}</span></div><div className="progress-track"><span style={{ width: `${item.progressToTarget}%` }} /></div></div>
    <div className="passport-stats"><span><strong>{item.evidenceCount}</strong> Evidence records</span><span><strong>{item.eligibleEvidenceCount}</strong> supporting level</span><span><strong>{item.evidenceQuality}</strong> quality</span><span><strong>{item.validationStatus}</strong></span></div>
    <div className="passport-next"><p className="eyebrow">Next recommended action</p><p>{item.nextRecommendedAction}</p>{item.requiresValidation && <small>Further validation is required. AI assessed is not MissionPro verified or externally certified.</small>}</div>
    {item.mostRecentRelevantAssessment && <div className="passport-latest"><strong>Most recent relevant assessment</strong><p>{item.mostRecentRelevantAssessment.sourceTitle} · {item.mostRecentRelevantAssessment.score ?? "—"}/100 · {item.mostRecentRelevantAssessment.status}</p></div>}
    <details className="passport-explain"><summary>Why this level? Inspect aggregation</summary><ul>{item.explanation.map((rule) => <li key={rule}>{rule}</li>)}</ul><h3>Supporting Evidence</h3>{item.supportingEvidence.length ? <div className="passport-evidence-list">{item.supportingEvidence.map((evidence) => <div key={evidence.id}><strong>{evidence.sourceTitle}</strong><span>{evidence.score ?? "—"}/100 · {evidence.status} · {evidence.quality}</span><small>Candidate L{evidence.candidateLevel ?? "—"} · rubric coverage {evidence.criterionCoverage}% · difficulty ×{evidence.difficultyFactor} · recency ×{evidence.recencyFactor}</small></div>)}</div> : <p className="muted">No Evidence supports a demonstrated level yet.</p>}</details>
  </section>;
}

function Level({ label, value }: { label: string; value: string }) {
  return <div className="passport-level"><span>{label}</span><strong>{value}</strong></div>;
}