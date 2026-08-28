"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Skill = {
  id?: string;
  code: string;
  name: string;
  description: string;
  category: string;
  skillType: string;
  requiredLevel: number;
};

type CapabilityDraft = {
  code: string;
  name: string;
  description: string;
  domain: string;
  purpose: string;
  businessOutcome: string;
  sourceIntent: string;
  outcomes: string[];
  skills: Skill[];
  knowledgeRequirements: string[];
  observableTasks: string[];
  targetLevel: number;
  successCriteria: string[];
  expectedEvidence: string[];
};

type Capability = CapabilityDraft & {
  id: string;
  version: number;
  status: string;
  updatedAt: string;
};

type MasteryLevel = {
  levelNumber: number;
  name: string;
  description: string;
  observableBehaviors: string[];
};

const referenceIntent = "Être capable d’identifier et prioriser les risques d’un projet public.";

function draftFromCapability(capability: Capability): CapabilityDraft {
  return {
    code: capability.code,
    name: capability.name,
    description: capability.description,
    domain: capability.domain ?? "",
    purpose: capability.purpose ?? "",
    businessOutcome: capability.businessOutcome ?? "",
    sourceIntent: capability.sourceIntent ?? capability.name,
    outcomes: capability.outcomes ?? [],
    skills: capability.skills,
    knowledgeRequirements: capability.knowledgeRequirements ?? [],
    observableTasks: capability.observableTasks ?? [],
    targetLevel: capability.targetLevel ?? 3,
    successCriteria: capability.successCriteria ?? [],
    expectedEvidence: capability.expectedEvidence ?? []
  };
}

function stringsToText(values: string[]) {
  return values.join("\n");
}

function textToStrings(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

export function CapabilityBuilder({
  initialCapabilities,
  masteryLevels
}: {
  initialCapabilities: Capability[];
  masteryLevels: MasteryLevel[];
}) {
  const [capabilities, setCapabilities] = useState(initialCapabilities);
  const [selectedId, setSelectedId] = useState<string | null>(initialCapabilities[0]?.id ?? null);
  const [draft, setDraft] = useState<CapabilityDraft | null>(
    initialCapabilities[0] ? draftFromCapability(initialCapabilities[0]) : null
  );
  const [intent, setIntent] = useState(referenceIntent);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<"generate" | "save" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedCapability = useMemo(
    () => capabilities.find((capability) => capability.id === selectedId),
    [capabilities, selectedId]
  );

  function updateDraft(field: keyof CapabilityDraft, value: string | number | string[] | Skill[]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  }

  function selectCapability(capability: Capability) {
    setSelectedId(capability.id);
    setDraft(draftFromCapability(capability));
    setIntent(capability.sourceIntent);
    setEditing(false);
    setError("");
    setNotice("");
  }

  async function generateDraft() {
    setBusy("generate");
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/capabilities/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "La génération a échoué.");
      setDraft(payload.draft);
      setSelectedId(null);
      setEditing(true);
      setNotice("NOVA Architect a préparé une fiche. Relisez-la puis acceptez-la pour la persister.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La génération a échoué.");
    } finally {
      setBusy(null);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setBusy("save");
    setError("");
    setNotice("");
    try {
      const response = await fetch(selectedId ? `/api/capabilities/${selectedId}` : "/api/capabilities", {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "La sauvegarde a échoué.");
      const saved = payload.capability as Capability;
      setCapabilities((current) => {
        const withoutSaved = current.filter((capability) => capability.id !== saved.id);
        return [saved, ...withoutSaved];
      });
      setSelectedId(saved.id);
      setDraft(draftFromCapability(saved));
      setIntent(saved.sourceIntent);
      setEditing(false);
      setNotice("Capability acceptée et enregistrée dans le Registry.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La sauvegarde a échoué.");
    } finally {
      setBusy(null);
    }
  }

  function updateList(field: "outcomes" | "knowledgeRequirements" | "observableTasks" | "successCriteria" | "expectedEvidence", value: string) {
    updateDraft(field, textToStrings(value));
  }

  function updateSkill(index: number, field: keyof Skill, value: string | number) {
    if (!draft) return;
    const skills = draft.skills.map((skill, skillIndex) =>
      skillIndex === index ? { ...skill, [field]: value } : skill
    );
    updateDraft("skills", skills);
  }

  function addSkill() {
    if (!draft) return;
    updateDraft("skills", [
      ...draft.skills,
      {
        code: `SKILL-NEW-${draft.skills.length + 1}`,
        name: "Nouvelle skill",
        description: "Décrire le comportement observable.",
        category: "professional",
        skillType: "professional",
        requiredLevel: draft.targetLevel
      }
    ]);
  }

  function removeSkill(index: number) {
    if (!draft) return;
    updateDraft("skills", draft.skills.filter((_, skillIndex) => skillIndex !== index));
  }

  return (
    <div className="capability-page">
      <section className="hero builder-hero">
        <p className="eyebrow">Capability Registry · Sprint 1</p>
        <h1>What do you want to be able to do?</h1>
        <p>
          Décrivez une intention professionnelle. NOVA Architect la transforme en Capability
          structurée ; vous gardez le contrôle avant toute persistance.
        </p>
        <div className="intent-builder">
          <label htmlFor="capability-intent">Votre intention</label>
          <textarea
            id="capability-intent"
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
            rows={3}
            placeholder={referenceIntent}
          />
          <div className="builder-actions">
            <button className="button" type="button" onClick={generateDraft} disabled={busy !== null}>
              {busy === "generate" ? "NOVA structure…" : "Générer avec NOVA Architect"}
            </button>
            <span className="muted">Aucun appel IA côté navigateur : la requête passe par l’orchestrateur serveur.</span>
          </div>
        </div>
      </section>

      {notice && <p className="notice success-notice" role="status">{notice}</p>}
      {error && <p className="notice error-notice" role="alert">{error}</p>}

      <div className="registry-layout">
        <aside className="registry-list card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Registry</p>
              <h2>Capabilities persistées</h2>
            </div>
            <span className="count-badge">{capabilities.length}</span>
          </div>
          {capabilities.length === 0 && <p className="muted">Aucune Capability acceptée pour le moment.</p>}
          <div className="registry-items">
            {capabilities.map((capability) => (
              <button
                className={`registry-item ${selectedId === capability.id ? "selected" : ""}`}
                key={capability.id}
                type="button"
                onClick={() => selectCapability(capability)}
              >
                <span className="registry-code">{capability.code}</span>
                <strong>{capability.name}</strong>
                <span className="muted">{capability.skills.length} skills · cible {capability.targetLevel}/5</span>
              </button>
            ))}
          </div>
        </aside>

        {draft ? (
          <section className="profile-panel">
            <div className="profile-header card">
              <div>
                <p className="eyebrow">Capability Profile</p>
                <h2>{draft.name}</h2>
                <p className="mono">{draft.code}</p>
              </div>
              <div className="profile-actions">
                {selectedCapability && <Link className="button secondary" href="/app/diagnostic">Run diagnostic</Link>}
                {!editing && selectedCapability && (
                  <button className="button secondary" type="button" onClick={() => setEditing(true)}>Edit</button>
                )}
                {(editing || !selectedCapability) && (
                  <button className="button" type="button" onClick={saveDraft} disabled={busy !== null}>
                    {busy === "save" ? "Enregistrement…" : "Accept & save"}
                  </button>
                )}
                <button className="button secondary" type="button" onClick={generateDraft} disabled={busy !== null}>
                  Regenerate
                </button>
              </div>
            </div>

            <div className="profile-grid">
              <article className="card profile-section">
                <div className="section-heading"><h3>Structure de la capacité</h3><span className="pill">Capability-first</span></div>
                <Field label="Nom" value={draft.name} editing={editing} onChange={(value) => updateDraft("name", value)} />
                <Field label="Intent source" value={draft.sourceIntent} editing={false} onChange={() => undefined} />
                <Field label="Description" value={draft.description} editing={editing} multiline onChange={(value) => updateDraft("description", value)} />
                <div className="field-grid">
                  <Field label="Domaine" value={draft.domain} editing={editing} onChange={(value) => updateDraft("domain", value)} />
                  <Field label="Niveau cible" value={String(draft.targetLevel)} editing={editing} type="number" onChange={(value) => updateDraft("targetLevel", Number(value))} />
                </div>
                <Field label="Purpose" value={draft.purpose} editing={editing} multiline onChange={(value) => updateDraft("purpose", value)} />
                <Field label="Business outcome" value={draft.businessOutcome} editing={editing} multiline onChange={(value) => updateDraft("businessOutcome", value)} />
                <ListField label="Outcomes attendus" values={draft.outcomes} editing={editing} onChange={(value) => updateList("outcomes", value)} />
              </article>

              <article className="card profile-section">
                <div className="section-heading"><h3>Skills associées</h3><span className="pill">{draft.skills.length} liées</span></div>
                <div className="skill-list">
                  {draft.skills.map((skill, index) => (
                    <div className="skill-row" key={`${skill.code}-${index}`}>
                      {editing ? (
                        <>
                          <input aria-label={`Code skill ${index + 1}`} value={skill.code} onChange={(event) => updateSkill(index, "code", event.target.value)} />
                          <input aria-label={`Nom skill ${index + 1}`} value={skill.name} onChange={(event) => updateSkill(index, "name", event.target.value)} />
                          <textarea aria-label={`Description skill ${index + 1}`} value={skill.description} onChange={(event) => updateSkill(index, "description", event.target.value)} rows={2} />
                          <div className="skill-meta">
                            <input aria-label={`Catégorie skill ${index + 1}`} value={skill.category} onChange={(event) => updateSkill(index, "category", event.target.value)} />
                            <input aria-label={`Niveau requis skill ${index + 1}`} type="number" min={1} max={5} value={skill.requiredLevel} onChange={(event) => updateSkill(index, "requiredLevel", Number(event.target.value))} />
                            <button className="text-button danger-text" type="button" onClick={() => removeSkill(index)}>Retirer</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div><span className="registry-code">{skill.code}</span><strong>{skill.name}</strong><p>{skill.description}</p></div>
                          <span className="skill-level">L{skill.requiredLevel}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {editing && <button className="text-button" type="button" onClick={addSkill}>+ Ajouter une skill</button>}
              </article>

              <article className="card profile-section">
                <h3>Connaissances & tâches observables</h3>
                <ListField label="Knowledge requirements · une ligne par item" values={draft.knowledgeRequirements} editing={editing} onChange={(value) => updateList("knowledgeRequirements", value)} />
                <ListField label="Observable tasks · une ligne par tâche" values={draft.observableTasks} editing={editing} onChange={(value) => updateList("observableTasks", value)} />
              </article>

              <article className="card profile-section">
                <h3>Critères & preuves attendues</h3>
                <ListField label="Success criteria · une ligne par critère" values={draft.successCriteria} editing={editing} onChange={(value) => updateList("successCriteria", value)} />
                <ListField label="Expected evidence · une ligne par preuve" values={draft.expectedEvidence} editing={editing} onChange={(value) => updateList("expectedEvidence", value)} />
              </article>
            </div>

            <div className="card mastery-profile">
              <div className="section-heading">
                <div><p className="eyebrow">Mastery scale</p><h3>Les cinq niveaux de maîtrise</h3></div>
                <span className="pill">Cible : niveau {draft.targetLevel}</span>
              </div>
              <div className="mastery-levels">
                {masteryLevels.map((level) => (
                  <div className={`mastery-level ${level.levelNumber === draft.targetLevel ? "target" : ""}`} key={level.levelNumber}>
                    <span className="level-number">{level.levelNumber}</span>
                    <strong>{level.name}</strong>
                    <p>{level.description}</p>
                    <ul>{level.observableBehaviors.map((behavior) => <li key={behavior}>{behavior}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="card empty-profile">
            <p className="eyebrow">Capability Profile</p>
            <h2>Générez votre première Capability</h2>
            <p>Commencez par l’intention ci-dessus ; NOVA proposera une fiche que vous pourrez éditer avant Accept.</p>
          </section>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  editing,
  onChange,
  multiline = false,
  type = "text"
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      {editing && multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} />
      ) : editing ? (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <p className="field-value">{value}</p>
      )}
    </label>
  );
}

function ListField({
  label,
  values,
  editing,
  onChange
}: {
  label: string;
  values: string[];
  editing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      {editing ? (
        <textarea value={stringsToText(values)} onChange={(event) => onChange(event.target.value)} rows={Math.max(3, Math.min(7, values.length + 1))} />
      ) : (
        <ul className="value-list">{values.map((value) => <li key={value}>{value}</li>)}</ul>
      )}
    </label>
  );
}