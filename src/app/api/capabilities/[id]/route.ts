import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { persistCapabilityDraft, serializeCapability } from "@/server/capabilities";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const body = (await request.json()) as { draft?: unknown };
    const capability = await persistCapabilityDraft(body.draft ?? body, user.id, params.id);
    return NextResponse.json({ capability: serializeCapability(capability) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update capability";
    const status = message.includes("belongs to another user") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}