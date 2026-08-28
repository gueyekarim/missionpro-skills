import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth";
import { NovaTutor } from "./nova-tutor";

export const dynamic = "force-dynamic";

export default async function NovaTutorPage() {
  await getCurrentUser();
  const capabilities = await db.capability.findMany({
    where: { status: "active" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, code: true, name: true }
  });
  return <NovaTutor initialCapabilities={capabilities} />;
}