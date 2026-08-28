import Link from "next/link";
import { REFERENCE_CAPABILITY } from "@/domain/mastery";

export default function AppHomePage() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">MissionPro Skills</p>
        <h1>What do you want to be able to do?</h1>
        <p>
          Ici, la capacité est le point de départ. Le Sprint 0 installe le socle sécurisé
          qui reliera plus tard intention, diagnostic, pratique, preuve et maîtrise.
        </p>
        <div className="chain" aria-label="Chaîne de valeur">
          {["Mission", "Outcome", "Capability", "Diagnosis", "Learning", "Practice", "Evidence", "Assessment", "Mastery", "Performance"].map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>
      <div className="grid">
        <article className="card">
          <p className="eyebrow">Référence MP-001</p>
          <h2>{REFERENCE_CAPABILITY.name}</h2>
          <p>La capacité de référence est seedée en base et servira au golden path des prochains sprints.</p>
        </article>
        <article className="card">
          <p className="eyebrow">NOVA</p>
          <h2>Un orchestrateur, plusieurs modes</h2>
          <p>Architect, diagnostician, tutor, practice, assessor et mentor sont préparés côté serveur.</p>
        </article>
        <article className="card">
          <p className="eyebrow">Vérification</p>
          <h2>Voir l’état du socle</h2>
          <p>Contrôlez la configuration, PostgreSQL, le seed et le smoke-test NOVA.</p>
          <p><Link className="button secondary" href="/app/status">Ouvrir le status</Link></p>
        </article>
      </div>
    </>
  );
}