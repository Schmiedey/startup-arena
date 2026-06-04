import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { requireAdmin, adminDenied } from "@/lib/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  try {
    const result = await sql`SELECT auto_accept_ideas FROM site_settings WHERE id = 1`;
    const settings = result.rows[0] || { auto_accept_ideas: true };
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings get error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;

  if (typeof payload.auto_accept_ideas !== "boolean") {
    return NextResponse.json({ error: "auto_accept_ideas must be true or false" }, { status: 400 });
  }

  try {
    await sql`
      INSERT INTO site_settings (id, auto_accept_ideas)
      VALUES (1, ${payload.auto_accept_ideas})
      ON CONFLICT (id) DO UPDATE SET auto_accept_ideas = ${payload.auto_accept_ideas}
    `;

    return NextResponse.json({ auto_accept_ideas: payload.auto_accept_ideas });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}