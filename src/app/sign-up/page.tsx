import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">MissionPro <span>Skills</span></div>
        <p className="eyebrow">Premier accès</p>
        <h1>Commencer par une capacité.</h1>
        <p>Créez un compte individuel. Les organisations et équipes restent hors du périmètre Sprint 0.</p>
        <SignUpForm />
        <p className="auth-foot">Déjà inscrit ? <Link href="/sign-in">Se connecter</Link></p>
      </section>
    </main>
  );
}