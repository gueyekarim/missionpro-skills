import { db } from "@/lib/db";
import { PracticeLab } from "./practice-lab";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const capabilities = await db.capability.findMany({
    where: { status: "active" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, code: true, name: true }
  });
  return <PracticeLab initialCapabilities={capabilities} />;
}