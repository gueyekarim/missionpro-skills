import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">MissionPro <span>Skills</span></div>
        <p className="eyebrow">Accès individuel</p>
        <h1>Construire des capacités démontrables.</h1>
        <p>Connectez-vous pour accéder à votre espace de développement capacitaire.</p>
        <SignInForm />
        <p className="auth-foot">Pas encore de compte ? <Link href="/sign-up">Créer un compte</Link></p>
      </section>
    </main>
  );
}