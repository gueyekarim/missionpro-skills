"use client";

import { useState } from "react";

export function NovaSmokeButton() {
  const [result, setResult] = useState<{ message: string; nextAction: string }>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function runSmokeTest() {
    setPending(true);
    setError("");
    const response = await fetch("/api/nova/smoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "tutor",
        task: "Explique le prochain pas pour la capacité MP-001.",
        context: { roleContext: "chef de projet public", currentCapability: { code: "CAP-PROJ-RISK-001" } }
      })
    });
    const body = await response.json();
    if (!response.ok) setError(body.error ?? "Smoke test échoué.");
    else setResult(body);
    setPending(false);
  }

  return (
    <>
      <button className="button" onClick={runSmokeTest} disabled={pending}>{pending ? "Exécution…" : "Lancer le smoke test"}</button>
      {error && <div className="form-error smoke-result">{error}</div>}
      {result && <div className="smoke-result"><strong>{result.message}</strong><br />Prochaine action : {result.nextAction}</div>}
    </>
  );
}