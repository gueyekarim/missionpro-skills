import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth";
import { reviewPractice } from "@/server/practice";

const reviewBodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("contest"), reason: z.string().trim().min(10).max(2000) }),
  z.object({ action: z.literal("reassess") })
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id: routeId } = await params;
  const id = z.string().uuid().safeParse(routeId);
  if (!id.success) return NextResponse.json({ error: "Invalid review target" }, { status: 400 });
  try {
    const body = reviewBodySchema.parse(await request.json());
    const result = body.action === "contest"
      ? await reviewPractice({ action: "contest", assessmentAttemptId: id.data, reason: body.reason }, user.id)
      : await reviewPractice({ action: "reassess", submissionId: id.data }, user.id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not review assessment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}