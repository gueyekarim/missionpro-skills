import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth";
import { DiagnosticEngine } from "./diagnostic-engine";

export const dynamic = "force-dynamic";

export default async function DiagnosticPage() {
  await getCurrentUser();
  const capabilities = await db.capability.findMany({
    where: { status: "active" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, code: true, name: true, targetLevel: true }
  });
  return <DiagnosticEngine initialCapabilities={capabilities.map((capability) => ({
    ...capability,
    targetLevel: capability.targetLevel ?? 3
  }))} />;
}