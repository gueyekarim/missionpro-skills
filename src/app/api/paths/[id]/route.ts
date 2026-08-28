import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/lib/db";
import { pathProgressSchema, serializePersonalPath } from "@/server/paths";

export const dynamic = "force-dynamic";

async function ownedPath(id: string, userId: string) {
  return db.personalCapabilityPath.findFirst({
    where: { id, userId },
    include: { items: { orderBy: { sequence: "asc" } } }
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const path = await ownedPath(id, user.id);
  if (!path) return NextResponse.json({ error: "Personal path not found" }, { status: 404 });
  return NextResponse.json({ path: serializePersonalPath(path) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { id } = await params;
    const progress = pathProgressSchema.parse(await request.json());
    const existing = await ownedPath(id, user.id);
    if (!existing) return NextResponse.json({ error: "Personal path not found" }, { status: 404 });
    if (!existing.items.some((item) => item.id === progress.itemId)) {
      return NextResponse.json({ error: "Path item not found" }, { status: 404 });
    }
    await db.$transaction(async (tx) => {
      await tx.personalPathItem.update({
        where: { id: progress.itemId },
        data: {
          status: progress.status,
          completedAt: progress.status === "completed" ? new Date() : null
        }
      });
      const items = await tx.personalPathItem.findMany({ where: { pathId: existing.id }, select: { id: true, status: true } });
      const statuses = items.map((item) => item.id === progress.itemId ? progress.status : item.status);
      await tx.personalCapabilityPath.update({
        where: { id: existing.id },
        data: { status: statuses.every((status) => status === "completed") ? "completed" : "in_progress" }
      });
    });
    const updated = await ownedPath(id, user.id);
    if (!updated) throw new Error("Personal path not found after update");
    return NextResponse.json({ path: serializePersonalPath(updated) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update path progress";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}