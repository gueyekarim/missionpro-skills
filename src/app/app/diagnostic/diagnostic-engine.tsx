"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Capability = { id: string; code: string; name: string; targetLevel: number };
type DiagnosticItem = { id: string; method: string; title: string; prompt: string; criteria: string[] };
type Instrument = { capability: Capability; methods: string[]; items: DiagnosticItem[]; referenceTasks: string[]; expectedEvidence: string[] };
type Result = {
  id?: string;
  observedLevel: number;
  targetLevel: number;
  capabilityGap: number;
  strengths: string[];
  weaknesses: string[];
  missingEvidence: string[];
  evidenceSupportingDiagnosis: Array<{ dimension: string; method: string; summary: string; score: number; maxScore: number; observedSignals: string[] }>;
  explanation: string;
  recommendedPriorities: string[];
  provenance: string;
  confidenceScore: number | string;
};

const masteryNames = ["Awareness", "Assisted Practice", "Autonomous Practice", "Advanced Practice", "System Mastery"];

export function DiagnosticEngine({ initialCapabilities }: { initialCapabilities: Capability[] }) {
  const [selectedId, setSelectedId] = useState(initialCapabilities[0]?.id ?? "");
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [selfAssessment, setSelfAssessment] = useState(2);
  const [knowledgeAnswer, setKnowledgeAnswer] = useState("");
  const [miniCaseAnswer, setMiniCaseAnswer] = useState("");
  const [productionAnswer, setProductionAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(Boolean(initialCapabilities[0]));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/diagnostics?capabilityId=${encodeURIComponent(selectedId)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Impossible de charger le diagnostic.");
        if (!cancelled) {
          setInstrument(payload.instrument);
          setResult(payload.latest);
        }
      })
      .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Impossible de charger le diagnostic."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  function resetAnswers() {
    setKnowledgeAnswer("");
    setMiniCaseAnswer("");
    setProductionAnswer("");
    setResult(null);
    setError("");
  }

  async function submitDiagnostic() {
    if (!selectedId) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capabilityId: selectedId,
          responses: { selfAssessment, knowledgeAnswer, miniCaseAnswer, productionAnswer }
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Le diagnostic a échoué.");
      setResult(payload.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Le diagnostic a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!initialCapabilities.length) {
    return (
      <section className="hero">
        <p className="eyebrow">Diagnostic Engine</p>
        <h1>Une Capability est nécessaire</h1>
        <p>Créez ou acceptez d’abord une Capability dans le Registry.</p>
        <Link className="button" href="/app/capabilities">Ouvrir le Registry</Link>
      </section>
    );
  }

  return (
    <div className="diagnostic-page">
      <section className="hero diagnostic-hero">
        <p className="eyebrow">Diagnostic Engine · Sprint 2</p>
        <h1>Où en êtes-vous réellement ?</h1>
        <p>
          Le diagnostic mesure des éléments démontrés avant de recommander le développement.
          Votre auto-évaluation apporte du contexte, mais ne peut jamais établir seule votre niveau.
        </p>
        <label htmlFor="diagnostic-capability">Capability diagnostiquée</label>
        <select id="diagnostic-capability" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); resetAnswers(); }}>
          {initialCapabilities.map((capability) => <option value={capability.id} key={capability.id}>{capability.code} · {capability.name}</option>)}
        </select>
      </section>

      {error && <p className="notice error-notice" role="alert">{error}</p>}
      {loading && <p className="notice">Chargement de l’instrument diagnostique…</p>}

      {instrument && !loading && (
        <>
          <div className="diagnostic-method card">
            <div className="section-heading">
              <div><p className="eyebrow">Méthode</p><h2>Quatre sources, une lecture explicable</h2></div>
              <span className="pill">Cible : {instrument.capability.targetLevel}/5</span>
            </div>
            <div className="method-grid">
              <div><span className="method-number">1</span><strong>Auto-évaluation</strong><p>Signal de contexte uniquement.</p></div>
              <div><span className="method-number">2</span><strong>Connaissances</strong><p>Concepts nécessaires à la Capability.</p></div>
              <div><span className="method-number">3</span><strong>Mini-cas</strong><p>Arbitrage dans une situation professionnelle.</p></div>
              <div><span className="method-number">4</span><strong>Production courte</strong><p>Trace observable de performance.</p></div>
            </div>
          </div>

          <section className="diagnostic-form card">
            <div className="section-heading"><div><p className="eyebrow">Démonstration</p><h2>Répondez avec vos propres mots</h2></div><span className="pill">3 activités observables</span></div>
            <label className="diagnostic-field">
              <span>Votre auto-évaluation (1–5)</span>
              <select value={selfAssessment} onChange={(event) => setSelfAssessment(Number(event.target.value))}>
                {masteryNames.map((name, index) => <option value={index + 1} key={name}>{index + 1} · {name}</option>)}
              </select>
              <small>Elle sera conservée comme contexte, mais ne compte pas seule dans le niveau observé.</small>
            </label>
            {instrument.items.map((item) => (
              <label className="diagnostic-field" key={item.id}>
                <span>{item.title}</span>
                <strong>{item.prompt}</strong>
                <textarea
                  rows={item.id === "production" ? 7 : 5}
                  value={item.id === "knowledge" ? knowledgeAnswer : item.id === "mini-case" ? miniCaseAnswer : productionAnswer}
                  onChange={(event) => item.id === "knowledge" ? setKnowledgeAnswer(event.target.value) : item.id === "mini-case" ? setMiniCaseAnswer(event.target.value) : setProductionAnswer(event.target.value)}
                  placeholder="Décrivez votre raisonnement et ce que vous feriez concrètement…"
                />
                <small>Critères observés : {item.criteria.join(" · ")}</small>
              </label>
            ))}
            <div className="builder-actions">
              <button className="button" type="button" onClick={submitDiagnostic} disabled={submitting}>
                {submitting ? "NOVA analyse…" : "Submit diagnostic"}
              </button>
              <button className="button secondary" type="button" onClick={resetAnswers} disabled={submitting}>Recommencer</button>
            </div>
          </section>

          {result && (
            <section className="diagnostic-result">
              <div className="result-summary card">
                <div><p className="eyebrow">Result · {result.provenance}</p><h2>Votre profil capacitaire initial</h2><p>{result.explanation}</p></div>
                <div className="result-levels">
                  <div><span>Observed</span><strong>{result.observedLevel}/5</strong><small>{masteryNames[result.observedLevel - 1]}</small></div>
                  <div><span>Target</span><strong>{result.targetLevel}/5</strong><small>{masteryNames[result.targetLevel - 1]}</small></div>
                  <div className="gap-value"><span>Capability gap</span><strong>{result.capabilityGap}</strong><small>Target − Observed</small></div>
                </div>
                <p className="formula">Required / Target Capability − Observed Capability = Capability Gap → {result.targetLevel} − {result.observedLevel} = {result.capabilityGap}</p>
              </div>
              <div className="result-grid">
                <ResultList title="Strengths" values={result.strengths} />
                <ResultList title="Weaknesses" values={result.weaknesses} />
                <ResultList title="Missing evidence" values={result.missingEvidence} />
                <ResultList title="Recommended development priorities" values={result.recommendedPriorities} />
              </div>
              <div className="evidence-card card">
                <div className="section-heading"><div><p className="eyebrow">Evidence supporting diagnosis</p><h3>Ce qui a été observé</h3></div><span className="pill">Confidence {Math.round(Number(result.confidenceScore) * 100)}%</span></div>
                <div className="evidence-grid">{result.evidenceSupportingDiagnosis.map((evidence) => <div key={evidence.dimension}><strong>{evidence.dimension}</strong><span>{evidence.score}/{evidence.maxScore} signaux</span><p>{evidence.observedSignals.join(" · ") || "Aucun signal explicite détecté."}</p></div>)}</div>
                <p className="muted">Le niveau est fondé sur les trois activités observables ; l’auto-évaluation n’établit pas une maîtrise vérifiée.</p>
                <div className="builder-actions"><Link className="button" href="/app/path">Build my personal path</Link></div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ResultList({ title, values }: { title: string; values: string[] }) {
  return <article className="card result-list"><h3>{title}</h3><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></article>;
}