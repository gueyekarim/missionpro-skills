import { db } from "@/lib/db";
import { isServerConfigPresent } from "@/lib/config";
import { NovaSmokeButton } from "./nova-smoke-button";

async function getDatabaseStatus() {
  if (!isServerConfigPresent()) return { ok: false, detail: "Configuration absente" };
  try {
    const [userCount, capabilityCount, masteryCount] = await Promise.all([
      db.user.count(),
      db.capability.count(),
      db.masteryLevel.count()
    ]);
    return { ok: true, detail: `${userCount} utilisateur(s) · ${capabilityCount} capacité(s) · ${masteryCount} niveau(x)` };
  } catch {
    return { ok: false, detail: "PostgreSQL indisponible ou migration non exécutée" };
  }
}

export default async function StatusPage() {
  const database = await getDatabaseStatus();
  return (
    <>
      <p className="eyebrow">Sprint 0 verification</p>
      <h1>System status</h1>
      <p>Les checks ci-dessous vérifient le socle, pas les fonctionnalités différées.</p>
      <div className="status-grid">
        <article className="card"><span className="muted">Configuration serveur</span><div className={`status-value ${isServerConfigPresent() ? "status-ok" : "status-bad"}`}>{isServerConfigPresent() ? "Ready" : "Missing"}</div></article>
        <article className="card"><span className="muted">PostgreSQL</span><div className={`status-value ${database.ok ? "status-ok" : "status-bad"}`}>{database.ok ? "Connected" : "Unavailable"}</div><p>{database.detail}</p></article>
        <article className="card"><span className="muted">NOVA</span><div className="status-value status-ok">Server-side</div><p>Provider mock par défaut · clé jamais envoyée au navigateur</p></article>
      </div>
      <section className="card">
        <h2>Controlled NOVA smoke test</h2>
        <p>Appel au service unique via une route serveur protégée. Les tests automatisés utilisent le provider mock.</p>
        <NovaSmokeButton />
      </section>
    </>
  );
}