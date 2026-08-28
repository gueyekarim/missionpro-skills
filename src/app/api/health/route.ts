import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    getServerConfig();
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "connected", service: "missionpro-skills" });
  } catch (error) {
    console.error("[health] check failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { status: "error", error: "Service unavailable" },
      { status: 503 }
    );
  }
}