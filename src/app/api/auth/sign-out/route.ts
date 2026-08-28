import { NextResponse } from "next/server";
import { clearSession } from "@/server/auth";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth] sign-out failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Déconnexion impossible." }, { status: 500 });
  }
}