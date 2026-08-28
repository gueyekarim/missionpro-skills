"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Capability = { id: string; code: string; name: string };
type Criterion = { code: string; label: string; maxScore: number; weight: number };
type Assessment = {
  id: string; submissionId: string; overallScore: number; criterionScores: Array<Criterion & { score: number; rationale: string }>;
  strengths: string[]; weaknesses: string[]; missingElements: string[]; explanation: string; feedback: string;
  recommendedNextAction: string; masteryRecommendation: string; provenance: string; limitations: string[];
  status: string; createdAt: string; contestReason?: string | null;
};
type Submission = { id: string; production: string; submittedAt: string; assessments: Assessment[] };
type Activity = {
  id: string; type: string; title: string; scenario: string; objective: string; expectedOutput: string;
  masteryLevel: number; skillCode: string | null; gapRationale: string; assessmentCriteria: Criterion[];
  submissions: Submission[];
};
type Dashboard = {
  capability: Capability;
  diagnostic: { observedLevel: number; targetLevel: number; capabilityGap: number };
  governance: { levels: string[]; notice: string };
  activities: Activity[];
};

const typeLabels: Record<string, string> = {
  exercise: "Guided exercise",
  case: "Professional case",
  challenge: "Challenge",
  simulation: "Short simulation",
  real_work: "Real-work task"
};

export function PracticeLab({ initialCapabilities }: { initialCapabilities: Capability[] }) {
  const [capabilityId, setCapabilityId] = useState(initialCapabilities[0]?.id ?? "");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [activityId, setActivityId] = useState("");
  const [production, setProduction] = useState("");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [evidenceSaved, setEvidenceSaved] = useState(false);
  const [loading, setLoading] = useState(Boolean(initialCapabilities[0]));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [contestReason, setContestReason] = useState("");
  const activity = useMemo(() => dashboard?.activities.find((item) => item.id === activityId) ?? dashboard?.activities[0], [dashboard, activityId]);

  async function loadDashboard(selectedCapabilityId = capabilityId) {
    if (!selectedCapabilityId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/practice?capabilityId=${encodeURIComponent(selectedCapabilityId)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Impossible de charger Practice Lab.");
      setDashboard(payload);
      setActivityId((current) => payload.activities.some((item: Activity) => item.id === current) ? current : payload.activities[0]?.id ?? "");
      setAssessment(null);
    } catch (caught) {
      setDashboard(null);
      setError(caught instanceof Error ? caught.message : "Impossible de charger Practice Lab.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadDashboard(capabilityId); }, [capabilityId]);

  async function submit() {
    if (!activity) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: activity.id, production })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "La production n’a pas pu être évaluée.");
      setAssessment(payload.assessment);
      setEvidenceSaved(false);
      await loadDashboard();
      setAssessment(payload.assessment);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La production n’a pas pu être évaluée.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEvidence() {
    if (!assessment) return;
    const response = await fetch("/api/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: assessment.submissionId })
    });
    const payload = await response.json();
    if (!response.ok) return setError(payload.error ?? "Evidence could not be saved.");
    setEvidenceSaved(true);
  }

  async function contest() {
    if (!assessment) return;
    const response = await fetch(`/api/practice/${assessment.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "contest", reason: contestReason })
    });
    const payload = await response.json();
    if (!response.ok) return setError(payload.error ?? "La contestation n’a pas pu être enregistrée.");
    setAssessment({ ...assessment, status: "contested", contestReason });
    setContestReason("");
  }

  async function reassess() {
    if (!assessment) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/practice/${assessment.submissionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reassess" })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "La réévaluation n’a pas pu être produite.");
      setAssessment({
        ...payload.output,
        id: payload.attempt.id,
        submissionId: assessment.submissionId,
        status: payload.attempt.status,
        createdAt: payload.attempt.createdAt
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La réévaluation n’a pas pu être produite.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!initialCapabilities.length) {
    return <section className="hero"><p className="eyebrow">Practice Lab</p><h1>Commencez par une Capability</h1><Link className="button" href="/app/capabilities">Ouvrir le Registry</Link></section>;
  }

  return (
    <div className="practice-page">
      <section className="hero practice-hero">
        <p className="eyebrow">Sprint 4 · Practice + Challenge + Assessment</p>
        <h1>Move from learning to observable performance.</h1>
        <p>LEARN → PRACTICE → PRODUCE → ASSESS. Une production est évaluée contre une rubric explicite ; compléter une activité ne suffit pas.</p>
        <label htmlFor="practice-capability">Capability</label>
        <select id="practice-capability" value={capabilityId} onChange={(event) => setCapabilityId(event.target.value)}>
          {initialCapabilities.map((item) => <option value={item.id} key={item.id}>{item.code} · {item.name}</option>)}
        </select>
      </section>

      {error && <p className="notice error-notice" role="alert">{error}</p>}
      {loading && <p className="notice">Practice Lab relie vos activités au diagnostic et au parcours…</p>}

      {!loading && dashboard && (
        <>
          <section className="card practice-context">
            <div className="section-heading"><div><p className="eyebrow">Capability-first context</p><h2>{dashboard.capability.name}</h2></div><span className="pill">Observed {dashboard.diagnostic.observedLevel}/5 → Target {dashboard.diagnostic.targetLevel}/5</span></div>
            <p>{dashboard.governance.notice}</p>
            <div className="provenance-ladder">{dashboard.governance.levels.map((level, index) => <span className={index === 0 ? "active" : ""} key={level}>{level}</span>)}</div>
          </section>

          <section className="practice-layout">
            <aside className="card practice-menu">
              <p className="eyebrow">Practice modes</p>
              {dashboard.activities.map((item) => <button type="button" className={activity?.id === item.id ? "selected" : ""} onClick={() => { setActivityId(item.id); setAssessment(null); setProduction(""); }} key={item.id}><span>{typeLabels[item.type] ?? item.type}</span><strong>{item.title}</strong></button>)}
            </aside>

            {activity && <div className="practice-main">
              <section className="card practice-brief">
                <div className="section-heading"><div><p className="eyebrow">{typeLabels[activity.type]} · Target L{activity.masteryLevel}</p><h2>{activity.title}</h2></div>{activity.skillCode && <span className="pill">{activity.skillCode}</span>}</div>
                <div><strong>Diagnosed rationale</strong><p>{activity.gapRationale}</p></div>
                <div><strong>Situation</strong><p>{activity.scenario}</p></div>
                <div><strong>Development objective</strong><p>{activity.objective}</p></div>
                <div><strong>Expected output</strong><p>{activity.expectedOutput}</p></div>
              </section>

              <section className="card rubric-card">
                <p className="eyebrow">Assessment rubric · visible before production</p>
                <h2>What NOVA Assessor will examine</h2>
                <div className="rubric-list">{activity.assessmentCriteria.map((criterion) => <div key={criterion.code}><span>{criterion.label}</span><strong>{Math.round(criterion.weight * 100)}% · /{criterion.maxScore}</strong></div>)}</div>
              </section>

              <section className="card production-card">
                <label><span>Your production</span><textarea rows={14} value={production} onChange={(event) => setProduction(event.target.value)} placeholder="Structurez une réponse ou un livrable professionnel évaluable…" /></label>
                <div className="builder-actions"><button className="button" type="button" onClick={submit} disabled={submitting || production.trim().length < 50}>{submitting ? "NOVA Assessor analyse…" : "Submit production for assessment"}</button><span className="muted">L’évaluation porte sur la production, jamais sur la seule complétion.</span></div>
              </section>
            </div>}
          </section>
        </>
      )}

      {assessment && <AssessmentResult assessment={assessment} contestReason={contestReason} setContestReason={setContestReason} contest={contest} reassess={reassess} submitting={submitting} saveEvidence={saveEvidence} evidenceSaved={evidenceSaved} />}
    </div>
  );
}

function AssessmentResult({ assessment, contestReason, setContestReason, contest, reassess, submitting, saveEvidence, evidenceSaved }: { assessment: Assessment; contestReason: string; setContestReason: (value: string) => void; contest: () => void; reassess: () => void; submitting: boolean; saveEvidence: () => void; evidenceSaved: boolean }) {
  return <section className="assessment-result">
    <div className="card assessment-score"><div><p className="eyebrow">{assessment.provenance} · {assessment.status}</p><h2>Assessment result</h2></div><strong>{assessment.overallScore}<span>/100</span></strong><p>{assessment.explanation}</p></div>
    <div className="criterion-results">{assessment.criterionScores.map((criterion) => <article className="card" key={criterion.code}><div><h3>{criterion.label}</h3><strong>{criterion.score}/{criterion.maxScore}</strong></div><p>{criterion.rationale}</p></article>)}</div>
    <div className="assessment-feedback">
      <article className="card"><h3>Strengths</h3><List values={assessment.strengths} empty="No criterion is yet strongly demonstrated." /></article>
      <article className="card"><h3>Weaknesses</h3><List values={assessment.weaknesses} empty="No partial criterion identified." /></article>
      <article className="card"><h3>Missing elements</h3><List values={assessment.missingElements} empty="No rubric element is missing." /></article>
    </div>
    <section className="card assessment-next"><div><p className="eyebrow">Feedback</p><p>{assessment.feedback}</p></div><div><p className="eyebrow">Recommended next action</p><p>{assessment.recommendedNextAction}</p></div><div className="governance-callout"><strong>Possible mastery implication</strong><p>{assessment.masteryRecommendation}</p><small>Assessment ≠ Certification. AI assessed is not Human validated, MissionPro verified or Externally certified.</small></div><div className="builder-actions"><button className="button" type="button" onClick={saveEvidence} disabled={evidenceSaved}>{evidenceSaved ? "Saved to Evidence Portfolio" : "Save this work as evidence"}</button>{evidenceSaved && <span className="muted">Evidence remains AI assessed and requires further validation.</span>}</div></section>
    <section className="card assessment-review"><h3>Review or contest this assessment</h3><p>NOVA can be reassessed and its output is not treated as infallible. Run the rubric again or state the issue and missing context for later review.</p><div className="builder-actions"><button className="button secondary" type="button" onClick={reassess} disabled={submitting}>{submitting ? "Reassessing…" : "Reassess this production"}</button></div><textarea rows={3} value={contestReason} onChange={(event) => setContestReason(event.target.value)} placeholder="Explain what should be reviewed…" /><button className="button secondary" type="button" onClick={contest} disabled={contestReason.trim().length < 10 || assessment.status === "contested"}>{assessment.status === "contested" ? "Contest recorded" : "Record contest"}</button></section>
  </section>;
}

function List({ values, empty }: { values: string[]; empty: string }) {
  return values.length ? <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul> : <p className="muted">{empty}</p>;
}