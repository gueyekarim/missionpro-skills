"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Capability = { id: string; code: string; name: string; targetLevel: number };
type Diagnostic = { id: string; observedLevel: number; targetLevel: number; capabilityGap: number; createdAt: string };
type PathItem = {
  id: string;
  sequence: number;
  stage: string;
  title: string;
  objective: string;
  activity: string;
  expectedOutput: string;
  completionCondition: string;
  gapRationale: string;
  skillCode: string | null;
  targetLevel: number;
  status: "not_started" | "in_progress" | "completed";
};
type Path = {
  id: string;
  status: string;
  observedLevel: number;
  targetLevel: number;
  capabilityGap: number;
  summary: string;
  provenance: string;
  items: PathItem[];
};

const stageLabels: Record<string, string> = {
  understand: "Understand",
  learn: "Learn",
  practice: "Guided Practice",
  challenge: "Challenge / Simulation",
  apply: "Real-work Application",
  prove: "Evidence",
  master: "Mastery Review"
};

export function PersonalPath({ initialCapabilities }: { initialCapabilities: Capability[] }) {
  const [selectedId, setSelectedId] = useState(initialCapabilities[0]?.id ?? "");
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [path, setPath] = useState<Path | null>(null);
  const [loading, setLoading] = useState(Boolean(initialCapabilities[0]));
  const [generating, setGenerating] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [error, setError] = useState("");
  const capability = useMemo(() => initialCapabilities.find((item) => item.id === selectedId), [initialCapabilities, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/paths?capabilityId=${encodeURIComponent(selectedId)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Impossible de charger le parcours.");
        if (!cancelled) {
          setDiagnostic(payload.diagnostic);
          setPath(payload.path);
        }
      })
      .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Impossible de charger le parcours."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  async function generatePath() {
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capabilityId: selectedId, diagnosticId: diagnostic?.id })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "La génération du parcours a échoué.");
      setPath(payload.path);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La génération du parcours a échoué.");
    } finally {
      setGenerating(false);
    }
  }

  async function updateProgress(itemId: string, status: PathItem["status"]) {
    if (!path) return;
    setUpdatingItem(itemId);
    setError("");
    try {
      const response = await fetch(`/api/paths/${path.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, status })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "La progression n’a pas pu être enregistrée.");
      setPath(payload.path);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La progression n’a pas pu être enregistrée.");
    } finally {
      setUpdatingItem(null);
    }
  }

  if (!initialCapabilities.length) {
    return <section className="hero"><p className="eyebrow">Your Path to Mastery</p><h1>Commencez par une Capability</h1><Link className="button" href="/app/capabilities">Ouvrir le Registry</Link></section>;
  }

  return (
    <div className="path-page">
      <section className="hero path-hero">
        <p className="eyebrow">Personal Capability Path · Sprint 3A</p>
        <h1>Your Path to Mastery</h1>
        <p>Un parcours ciblé sur ce qu’il vous reste à démontrer — pas un syllabus générique, et pas une répétition de ce que le diagnostic montre déjà acquis.</p>
        <label htmlFor="path-capability">Capability</label>
        <select id="path-capability" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setPath(null); setDiagnostic(null); }}>
          {initialCapabilities.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
        </select>
      </section>

      {error && <p className="notice error-notice" role="alert">{error}</p>}
      {loading && <p className="notice">Chargement de votre état diagnostique…</p>}

      {!loading && !diagnostic && (
        <section className="card path-empty">
          <p className="eyebrow">Diagnostic requis</p>
          <h2>Le parcours doit partir d’un état démontré</h2>
          <p>Complétez d’abord le diagnostic pour cette Capability. Le niveau, les gaps et les signaux observés détermineront les activités retenues.</p>
          <Link className="button" href="/app/diagnostic">Run diagnostic</Link>
        </section>
      )}

      {!loading && diagnostic && !path && (
        <section className="card path-ready">
          <div>
            <p className="eyebrow">Diagnostic disponible</p>
            <h2>{capability?.name}</h2>
            <p>Niveau observé {diagnostic.observedLevel}/5 → cible {diagnostic.targetLevel}/5 · Gap {diagnostic.capabilityGap}</p>
          </div>
          <button className="button" type="button" onClick={generatePath} disabled={generating}>
            {generating ? "NOVA construit votre parcours…" : "Generate my personal path"}
          </button>
        </section>
      )}

      {path && (
        <>
          <section className="card path-summary">
            <div>
              <p className="eyebrow">Personal path · {path.provenance}</p>
              <h2>{capability?.name}</h2>
              <p>{path.summary}</p>
            </div>
            <div className="path-levels">
              <div><span>Observed</span><strong>{path.observedLevel}/5</strong></div>
              <span className="path-arrow">→</span>
              <div><span>Target</span><strong>{path.targetLevel}/5</strong></div>
              <div className="path-gap"><span>Gap</span><strong>{path.capabilityGap}</strong></div>
            </div>
            <div className="path-actions">
              <button className="button secondary" type="button" onClick={generatePath} disabled={generating}>{generating ? "Regénération…" : "Regenerate from latest diagnosis"}</button>
              <span className="muted">La complétion suit l’activité ; elle ne modifie pas automatiquement la maîtrise.</span>
            </div>
          </section>

          <section className="path-timeline" aria-label="Personal capability path">
            {path.items.map((item) => (
              <article className={`card path-item status-${item.status}`} key={item.id}>
                <div className="path-marker"><span>{item.sequence}</span><i /></div>
                <div className="path-item-body">
                  <div className="section-heading">
                    <div><p className="eyebrow">{stageLabels[item.stage] ?? item.stage}</p><h3>{item.title}</h3></div>
                    <div className="path-tags">{item.skillCode && <span className="pill">{item.skillCode}</span>}<span className="pill">Target L{item.targetLevel}</span></div>
                  </div>
                  <p className="path-rationale"><strong>Why this is in your path:</strong> {item.gapRationale}</p>
                  <div className="path-item-grid">
                    <div><span>Development objective</span><p>{item.objective}</p></div>
                    <div><span>Activity</span><p>{item.activity}</p></div>
                    <div><span>Expected output</span><p>{item.expectedOutput}</p></div>
                    <div><span>Completion condition</span><p>{item.completionCondition}</p></div>
                  </div>
                  <label className="progress-control">
                    <span>Activity progress</span>
                    <select value={item.status} onChange={(event) => updateProgress(item.id, event.target.value as PathItem["status"])} disabled={updatingItem === item.id}>
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                </div>
              </article>
            ))}
          </section>
          <p className="mastery-disclaimer">Path completion ≠ mastery. Mastery still requires explicit assessment and evidence linked to the Capability.</p>
        </>
      )}
    </div>
  );
}