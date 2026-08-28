import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth";
import { generateTutorResponse, getTutorSnapshot, serializeTutorSnapshot } from "@/server/tutor";
import { tutorRequestSchema } from "@/server/nova/context-contract";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const capabilityId = z.string().uuid().safeParse(new URL(request.url).searchParams.get("capabilityId"));
  const pathItemId = z.string().uuid().optional().safeParse(new URL(request.url).searchParams.get("pathItemId") ?? undefined);
  if (!capabilityId.success || !pathItemId.success) {
    return NextResponse.json({ error: "A valid capabilityId is required" }, { status: 400 });
  }
  try {
    const snapshot = await getTutorSnapshot(capabilityId.data, user.id, pathItemId.data);
    return NextResponse.json(serializeTutorSnapshot(snapshot));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load NOVA Tutor";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = tutorRequestSchema.parse(await request.json());
    const response = await generateTutorResponse(body, user.id);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate NOVA Tutor response";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}