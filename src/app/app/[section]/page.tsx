import { notFound } from "next/navigation";

const sections: Record<string, { title: string; description: string }> = {
  capabilities: { title: "Capabilities", description: "Le Capability Registry et le Capability Builder sont disponibles." },
  path: { title: "My Path", description: "Le parcours personnalisé sera activé après le diagnostic au Sprint 3." },
  nova: { title: "NOVA", description: "Le socle serveur NOVA est disponible dans System status ; l’expérience Tutor viendra plus tard." },
  practice: { title: "Practice", description: "Le Practice Lab et les challenges professionnels sont explicitement différés." },
  evidence: { title: "Evidence", description: "Le portefeuille de preuves sera activé avec l’évaluation et la traçabilité au Sprint 5." },
  passport: { title: "Passport", description: "Le Capability Passport sera activé lorsque des preuves évaluées existeront." }
};

export default async function PlaceholderPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: sectionId } = await params;
  const section = sections[sectionId];
  if (!section) notFound();
  return (
    <section className="hero">
      <p className="eyebrow">Placeholder Sprint 0</p>
      <h1>{section.title}</h1>
      <p>{section.description}</p>
      <p className="muted">Cette route existe pour vérifier la navigation, sans implémenter une fonctionnalité de Sprint 1 ou ultérieure.</p>
    </section>
  );
}