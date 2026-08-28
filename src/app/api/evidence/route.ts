import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { getEvidencePortfolio, saveSubmissionAsEvidence } from "@/server/evidence";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json(await getEvidencePortfolio(user.id));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const evidence = await saveSubmissionAsEvidence(await request.json(), user.id);
    return NextResponse.json({
      evidence,
      governance: "AI assessed evidence saved. Further validation is required; this is not certification."
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save evidence";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}