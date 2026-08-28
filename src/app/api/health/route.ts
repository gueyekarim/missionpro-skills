import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerConfig } from "@/lib/config";

export async function GET() {
  try {
    getServerConfig();
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "connected", service: "missionpro-skills" });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "health check failed" },
      { status: 503 }
    );
  }
}