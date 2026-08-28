"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Capability = { id: string; code: string; name: string };
type TutorSnapshot = {
  capability: { id: string; code: string; name: string; skills: Array<{ code: string; name: string; requiredLevel: number }> };
  diagnostic: { id: string; observedLevel: number; targetLevel: number; capabilityGap: number };
  path: { id: string; status: string; summary: string; items: Array<{ id: string; sequence: number; stage: string; title: string; status: string; skillCode: string | null }> } | null;
  currentItem: { id: string; sequence: number; stage: string; title: string; objective: string; activity: string; expectedOutput: string; completionCondition: string; status: string } | null;
  previousActivities: Array<{ mode: string; action: string; stage: string | null; observedLevel: number; createdAt: string }>;
  modes: string[];
};
type TutorMode = "LEARN" | "ASK NOVA" | "MY WORK";
type TutorOutput = {
  mode: TutorMode;
  response: string;
  teachingPoint: string;
  questionForLearner: string;
  examples: string[];
  reasoningSteps: string[];
  feedback: string;
  professionalConnection: string;
  suggestedExercise: string;
  nextAction: string;
  provenance: string;
};

const prompts: Record<TutorMode, string> = {
  LEARN: "Explique-moi la notion qui m’aidera à franchir cette étape.",
  "ASK NOVA": "Aide-moi à raisonner sur cette situation.",
  "MY WORK": "Comment relier cette Capability à mon travail actuel ?"
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

export function NovaTutor({ initialCapabilities }: { initialCapabilities: Capability[] }) {
  const [selectedId, setSelectedId] = useState(initialCapabilities[0]?.id ?? "");
  const [snapshot, setSnapshot] = useState<TutorSnapshot | null>(null);
  const [mode, setMode] = useState<TutorMode>("LEARN");
  const [question, setQuestion] = useState(prompts.LEARN);
  const [output, setOutput] = useState<TutorOutput | null>(null);
  const [loading, setLoading] = useState(Boolean(initialCapabilities[0]));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/tutor?capabilityId=${encodeURIComponent(selectedId)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Impossible de charger le contexte NOVA.");
        if (!cancelled) {
          setSnapshot(payload);
          setOutput(null);
        }
      })
      .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Impossible de charger le contexte NOVA."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  function changeMode(nextMode: TutorMode) {
    setMode(nextMode);
    setQuestion(prompts[nextMode]);
    setOutput(null);
  }

  async function askTutor() {
    if (!snapshot) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capabilityId: selectedId, pathItemId: snapshot.currentItem?.id, mode, question })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "NOVA Tutor n’a pas pu répondre.");
      setOutput(payload.output);
      const refreshed = await fetch(`/api/tutor?capabilityId=${encodeURIComponent(selectedId)}&pathItemId=${encodeURIComponent(snapshot.currentItem?.id ?? "")}`);
      if (refreshed.ok) setSnapshot(await refreshed.json());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "NOVA Tutor n’a pas pu répondre.");
    } finally {
      setSending(false);
    }
  }

  if (!initialCapabilities.length) {
    return <section className="hero"><p className="eyebrow">NOVA Tutor</p><h1>Commencez par une Capability</h1><Link className="button" href="/app/capabilities">Ouvrir le Registry</Link></section>;
  }

  return (
    <div className="tutor-page">
      <section className="hero tutor-hero">
        <p className="eyebrow">NOVA Tutor · Sprint 3B</p>
        <h1>Learn with your Capability in view.</h1>
        <p>NOVA n’est pas un chatbot générique : chaque réponse est construite avec votre Capability, votre niveau observé, votre gap, votre parcours et l’étape en cours.</p>
        <label htmlFor="tutor-capability">Capability</label>
        <select id="tutor-capability" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
          {initialCapabilities.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
        </select>
      </section>

      {error && <p className="notice error-notice" role="alert">{error}</p>}
      {loading && <p className="notice">NOVA construit le contexte pédagogique…</p>}

      {!loading && snapshot && (
        <>
          <section className="tutor-context card">
            <div className="section-heading"><div><p className="eyebrow">Context Contract</p><h2>La réponse part de votre état réel</h2></div><span className="pill">Server-side context</span></div>
            <div className="tutor-context-grid">
              <div><span>Observed</span><strong>{snapshot.diagnostic.observedLevel}/5</strong></div>
              <div><span>Target</span><strong>{snapshot.diagnostic.targetLevel}/5</strong></div>
              <div><span>Capability gap</span><strong>{snapshot.diagnostic.capabilityGap}</strong></div>
              <div><span>Current stage</span><strong>{snapshot.currentItem ? stageLabels[snapshot.currentItem.stage] ?? snapshot.currentItem.stage : "No path item"}</strong></div>
            </div>
            {snapshot.currentItem ? (
              <div className="current-learning-item">
                <p className="eyebrow">Current path activity · {snapshot.currentItem.status}</p>
                <h3>{snapshot.currentItem.title}</h3>
                <p>{snapshot.currentItem.objective}</p>
                <small>Expected output: {snapshot.currentItem.expectedOutput}</small>
              </div>
            ) : (
              <div className="notice">Générez d’abord votre Personal Capability Path pour donner à NOVA une étape concrète.</div>
            )}
            <div className="tutor-skills"><span>Associated skills</span>{snapshot.capability.skills.map((skill) => <span className="pill" key={skill.code}>{skill.name} · L{skill.requiredLevel}</span>)}</div>
          </section>

          {!snapshot.path ? (
            <section className="card path-empty"><p className="eyebrow">Path required</p><h2>Le tutorat suit votre parcours personnel</h2><p>Générez votre Personal Capability Path pour que NOVA sache quelle activité vous accompagne maintenant.</p><Link className="button" href="/app/path">Build my personal path</Link></section>
          ) : (
            <section className="tutor-workspace card">
              <div className="tutor-modes" role="tablist" aria-label="NOVA Tutor modes">
                {(["LEARN", "ASK NOVA", "MY WORK"] as TutorMode[]).map((option) => <button className={`tutor-mode ${mode === option ? "selected" : ""}`} type="button" role="tab" aria-selected={mode === option} key={option} onClick={() => changeMode(option)}>{option}</button>)}
              </div>
              <label className="tutor-question"><span>{mode === "MY WORK" ? "Votre situation de travail" : "Votre question"}</span><textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={5} placeholder={prompts[mode]} /></label>
              <div className="builder-actions"><button className="button" type="button" onClick={askTutor} disabled={sending}>{sending ? "NOVA réfléchit…" : "Ask NOVA Tutor"}</button><span className="muted">La question et la réponse restent hors de la base ; seul un événement pédagogique minimal est journalisé.</span></div>
            </section>
          )}

          {output && (
            <section className="tutor-response">
              <div className="card tutor-response-main"><div className="section-heading"><div><p className="eyebrow">{output.mode} · {output.provenance}</p><h2>NOVA répond depuis votre parcours</h2></div><span className="pill">Contextualized</span></div><p className="tutor-lead">{output.response}</p><div className="tutor-highlight"><strong>Teaching point</strong><p>{output.teachingPoint}</p></div><div className="tutor-highlight"><strong>Question for you</strong><p>{output.questionForLearner}</p></div></div>
              <div className="tutor-response-grid"><TutorBlock title="Example" values={output.examples} /><TutorBlock title="Reasoning guide" values={output.reasoningSteps} /><TutorBlock title="Feedback" values={[output.feedback]} /><TutorBlock title="Suggested exercise" values={[output.suggestedExercise]} /><TutorBlock title="Connect to professional work" values={[output.professionalConnection]} /><TutorBlock title="Next action" values={[output.nextAction]} /></div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TutorBlock({ title, values }: { title: string; values: string[] }) {
  return <article className="card tutor-block"><h3>{title}</h3><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></article>;
}