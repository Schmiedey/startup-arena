import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const result = await sql`SELECT id, is_admin FROM users WHERE email = ${session.user.email}`;
  const user = result.rows[0];
  if (!user?.is_admin) return null;
  return user;
}

export function adminDenied() {
  return NextResponse.json({ error: "Admin access required" }, { status: 403 });
}

export async function checkBanned(): Promise<{ banned: boolean; userId: string } | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const result = await sql`SELECT id, banned FROM users WHERE email = ${session.user.email}`;
  const user = result.rows[0];
  if (!user) return null;
  return { banned: !!user.banned, userId: user.id };
}

export function bannedResponse() {
  return NextResponse.json({ error: "Your account has been suspended" }, { status: 403 });
}