import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth";
import { NovaOrchestrator } from "@/server/nova/orchestrator";
import { contextContractSchema, novaModes } from "@/server/nova/context-contract";

const requestSchema = z.object({
  mode: z.enum(novaModes).default("tutor"),
  task: z.string().trim().min(1).max(2000),
  context: contextContractSchema
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const input = requestSchema.parse(await request.json());
    const output = await new NovaOrchestrator().run(input.mode, input.context, input.task);
    return NextResponse.json(output);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Context NOVA invalide." }, { status: 400 });
    console.error("[nova] smoke route failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "NOVA indisponible." }, { status: 502 });
  }
}