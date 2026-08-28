import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth";
import {
  getLatestPersonalPath,
  pathRequestSchema,
  persistPersonalPath,
  serializePersonalPath
} from "@/server/paths";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const capabilityId = z.string().uuid().safeParse(new URL(request.url).searchParams.get("capabilityId"));
  if (!capabilityId.success) return NextResponse.json({ error: "A valid capabilityId is required" }, { status: 400 });

  const [capability, diagnostic, path] = await Promise.all([
    db.capability.findUnique({
      where: { id: capabilityId.data },
      select: { id: true, code: true, name: true, targetLevel: true }
    }),
    db.diagnosticSession.findFirst({
      where: { capabilityId: capabilityId.data, userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, observedLevel: true, targetLevel: true, capabilityGap: true, createdAt: true }
    }),
    getLatestPersonalPath(capabilityId.data, user.id)
  ]);
  if (!capability) return NextResponse.json({ error: "Capability not found" }, { status: 404 });
  return NextResponse.json({
    capability,
    diagnostic: diagnostic ? { ...diagnostic, createdAt: diagnostic.createdAt.toISOString() } : null,
    path: path ? serializePersonalPath(path) : null
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = pathRequestSchema.parse(await request.json());
    const saved = await persistPersonalPath(body, user.id);
    return NextResponse.json({
      path: serializePersonalPath(saved.path),
      capability: { id: saved.capability.id, code: saved.capability.code, name: saved.capability.name }
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate personal path";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}