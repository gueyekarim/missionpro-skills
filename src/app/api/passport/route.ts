import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { getCapabilityPassport } from "@/server/passport";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json(await getCapabilityPassport(user.id));
}