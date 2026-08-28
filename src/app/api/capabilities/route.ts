import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth";
import { persistCapabilityDraft, serializeCapability } from "@/server/capabilities";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const capabilities = await db.capability.findMany({
    where: { status: "active" },
    orderBy: { updatedAt: "desc" },
    include: { skills: { include: { skill: true } } }
  });
  return NextResponse.json({
    capabilities: capabilities.map(serializeCapability)
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const body = (await request.json()) as { draft?: unknown };
    const capability = await persistCapabilityDraft(body.draft ?? body, user.id);
    return NextResponse.json({ capability: serializeCapability(capability) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save capability";
    const status = message.includes("belongs to another user") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}