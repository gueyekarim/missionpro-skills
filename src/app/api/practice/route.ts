import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth";
import { getPracticeDashboard, serializePracticeDashboard, submitPractice } from "@/server/practice";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const capabilityId = z.string().uuid().safeParse(new URL(request.url).searchParams.get("capabilityId"));
  if (!capabilityId.success) return NextResponse.json({ error: "A valid capabilityId is required" }, { status: 400 });
  try {
    return NextResponse.json(serializePracticeDashboard(await getPracticeDashboard(capabilityId.data, user.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load Practice Lab";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const saved = await submitPractice(await request.json(), user.id);
    return NextResponse.json({
      submission: { id: saved.submission.id, submittedAt: saved.submission.submittedAt.toISOString() },
      assessment: {
        id: saved.attempt.id,
        submissionId: saved.submission.id,
        ...saved.output,
        status: saved.attempt.status,
        createdAt: saved.attempt.createdAt.toISOString()
      },
      governance: "Assessment ≠ Certification. AI assessed is not human validated or verified mastery."
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not assess practice submission";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}