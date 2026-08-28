import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth";
import { serializeCapability } from "@/server/capabilities";
import { CapabilityBuilder } from "./capability-builder";

export const dynamic = "force-dynamic";

export default async function CapabilitiesPage() {
  await getCurrentUser();
  const [capabilities, masteryLevels] = await Promise.all([
    db.capability.findMany({
      where: { status: "active" },
      orderBy: { updatedAt: "desc" },
      include: { skills: { include: { skill: true } } }
    }),
    db.masteryLevel.findMany({ orderBy: { levelNumber: "asc" } })
  ]);

  return (
    <CapabilityBuilder
      initialCapabilities={capabilities.map(serializeCapability)}
      masteryLevels={masteryLevels.map(({ levelNumber, name, description, observableBehaviors }) => ({
        levelNumber,
        name,
        description,
        observableBehaviors: Array.isArray(observableBehaviors)
          ? observableBehaviors.filter((behavior): behavior is string => typeof behavior === "string")
          : []
      }))}
    />
  );
}