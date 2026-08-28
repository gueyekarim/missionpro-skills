"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Connexion impossible.");
      setPending(false);
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>Email <input name="email" type="email" autoComplete="email" required /></label>
      <label>Mot de passe <input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
      {error && <div className="form-error">{error}</div>}
      <button className="button" disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</button>
    </form>
  );
}