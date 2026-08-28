import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/lib/db";
import { serializeDiagnostic } from "@/server/diagnostics";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const diagnostic = await db.diagnosticSession.findFirst({ where: { id, userId: user.id } });
  if (!diagnostic) return NextResponse.json({ error: "Diagnostic not found" }, { status: 404 });
  return NextResponse.json({ diagnostic: serializeDiagnostic(diagnostic) });
}