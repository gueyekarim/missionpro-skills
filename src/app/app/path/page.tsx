import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth";
import { PersonalPath } from "./personal-path";

export const dynamic = "force-dynamic";

export default async function PersonalPathPage() {
  await getCurrentUser();
  const capabilities = await db.capability.findMany({
    where: { status: "active" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, code: true, name: true, targetLevel: true }
  });
  return <PersonalPath initialCapabilities={capabilities.map((capability) => ({
    ...capability,
    targetLevel: capability.targetLevel ?? 3
  }))} />;
}