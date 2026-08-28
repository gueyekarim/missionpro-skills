import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth";
import { diagnosticRequestSchema, getDiagnosticInstrument, persistDiagnostic, serializeDiagnostic } from "@/server/diagnostics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const capabilityId = z.string().uuid().safeParse(new URL(request.url).searchParams.get("capabilityId"));
  if (!capabilityId.success) return NextResponse.json({ error: "A valid capabilityId is required" }, { status: 400 });

  const capability = await db.capability.findUnique({
    where: { id: capabilityId.data },
    select: {
      id: true, code: true, name: true, description: true, targetLevel: true,
      observableTasks: true, knowledgeRequirements: true, evidenceRequirements: true
    }
  });
  if (!capability) return NextResponse.json({ error: "Capability not found" }, { status: 404 });
  const latest = await db.diagnosticSession.findFirst({
    where: { userId: user.id, capabilityId: capability.id },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({
    capability: { id: capability.id, code: capability.code, name: capability.name, description: capability.description },
    instrument: getDiagnosticInstrument(capability),
    latest: latest ? serializeDiagnostic(latest) : null
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = diagnosticRequestSchema.parse(await request.json());
    const saved = await persistDiagnostic(body, user.id);
    return NextResponse.json({
      diagnostic: serializeDiagnostic(saved.session),
      capability: { id: saved.capability.id, code: saved.capability.code, name: saved.capability.name },
      result: saved.result
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not complete diagnostic";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}