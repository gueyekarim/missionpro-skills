import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/server/auth";

const signUpSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128)
});

export async function POST(request: Request) {
  try {
    const input = signUpSchema.parse(await request.json());
    const email = input.email.toLowerCase();
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
    const user = await db.user.create({
      data: { name: input.name, email, passwordHash: await hashPassword(input.password) }
    });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Nom, email ou mot de passe invalide." }, { status: 400 });
    console.error("[auth] sign-up failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Création du compte impossible." }, { status: 500 });
  }
}