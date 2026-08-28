import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth";
import { NovaOrchestrator } from "@/server/nova/orchestrator";

const intentSchema = z.string().trim().min(10).max(500);

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const body = (await request.json()) as { intent?: unknown };
    const intent = intentSchema.parse(body.intent);
    const draft = await new NovaOrchestrator().runArchitect(
      {
        user: { id: user.id, name: user.name ?? undefined },
        roleContext: "Capability Builder",
        currentCapability: { name: intent },
        recentAssessments: [],
        evidenceAvailable: [],
        weaknessesOrGaps: []
      },
      intent
    );
    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate capability draft";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}