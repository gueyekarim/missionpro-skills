import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/server/auth";

const signInSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128)
});

export async function POST(request: Request) {
  try {
    const input = signInSchema.parse(await request.json());
    const user = await db.user.findUnique({ where: { email: input.email.toLowerCase() } });
    const valid = user?.passwordHash ? await verifyPassword(input.password, user.passwordHash) : false;
    if (!user || !valid) return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Email ou mot de passe invalide." }, { status: 400 });
    console.error("[auth] sign-in failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Connexion impossible." }, { status: 500 });
  }
}