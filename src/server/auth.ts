import "server-only";

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getServerConfig } from "@/lib/config";

const SESSION_COOKIE = "missionpro_session";
const SESSION_DAYS = 14;

function tokenHash(token: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

function sessionCookieOptions(expires: Date) {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const { SESSION_SECRET } = getServerConfig();
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { tokenHash: tokenHash(token, SESSION_SECRET), userId, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set({ ...sessionCookieOptions(expiresAt), value: token });
}

export async function clearSession() {
  const { SESSION_SECRET } = getServerConfig();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: tokenHash(token, SESSION_SECRET) } });
  cookieStore.set({ ...sessionCookieOptions(new Date(0)), value: "" });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { SESSION_SECRET } = getServerConfig();
    const session = await db.session.findUnique({
      where: { tokenHash: tokenHash(token, SESSION_SECRET) },
      include: { user: true }
    });
    if (!session || session.expiresAt <= new Date()) return null;
    return session.user;
  } catch (error) {
    console.error("[auth] session lookup failed", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

export { SESSION_COOKIE };