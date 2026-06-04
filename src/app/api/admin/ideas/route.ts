import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { requireAdmin, adminDenied } from "@/lib/admin";
import { deleteIdeaCascade } from "@/lib/db";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;

  try {
    let ideas, count;

    if (search && status) {
      const pat = `%${search}%`;
      [ideas, count] = await Promise.all([
        sql`SELECT i.*, u.name as user_name, u.image as user_image FROM ideas i LEFT JOIN users u ON i.user_id = u.id
            WHERE (i.name ILIKE ${pat} OR i.pitch ILIKE ${pat}) AND i.status = ${status}
            ORDER BY
              CASE WHEN i.status = 'pending' THEN 0 WHEN i.status = 'approved' THEN 1 ELSE 2 END,
              i.created_at DESC
            LIMIT ${limit} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM ideas WHERE (name ILIKE ${pat} OR pitch ILIKE ${pat}) AND status = ${status}`,
      ]);
    } else if (search) {
      const pat = `%${search}%`;
      [ideas, count] = await Promise.all([
        sql`SELECT i.*, u.name as user_name, u.image as user_image FROM ideas i LEFT JOIN users u ON i.user_id = u.id
            WHERE (i.name ILIKE ${pat} OR i.pitch ILIKE ${pat})
            ORDER BY
              CASE WHEN i.status = 'pending' THEN 0 WHEN i.status = 'approved' THEN 1 ELSE 2 END,
              i.created_at DESC
            LIMIT ${limit} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM ideas WHERE (name ILIKE ${pat} OR pitch ILIKE ${pat})`,
      ]);
    } else if (status) {
      [ideas, count] = await Promise.all([
        sql`SELECT i.*, u.name as user_name, u.image as user_image FROM ideas i LEFT JOIN users u ON i.user_id = u.id
            WHERE i.status = ${status}
            ORDER BY
              CASE WHEN i.status = 'pending' THEN 0 WHEN i.status = 'approved' THEN 1 ELSE 2 END,
              i.created_at DESC
            LIMIT ${limit} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM ideas WHERE status = ${status}`,
      ]);
    } else {
      [ideas, count] = await Promise.all([
        sql`SELECT i.*, u.name as user_name, u.image as user_image FROM ideas i LEFT JOIN users u ON i.user_id = u.id
            ORDER BY
              CASE WHEN i.status = 'pending' THEN 0 WHEN i.status = 'approved' THEN 1 ELSE 2 END,
              i.created_at DESC
            LIMIT ${limit} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM ideas`,
      ]);
    }

    return NextResponse.json({
      ideas: ideas.rows,
      total: Number(count.rows[0].count),
      page,
      totalPages: Math.ceil(Number(count.rows[0].count) / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
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

  const ideaId = typeof payload.ideaId === "string" ? payload.ideaId.trim() : "";
  if (!ideaId) {
    return NextResponse.json({ error: "ideaId required" }, { status: 400 });
  }

  const newStatus = typeof payload.status === "string" ? payload.status.trim() : "";
  if (!["approved", "rejected"].includes(newStatus)) {
    return NextResponse.json({ error: "Status must be 'approved' or 'rejected'" }, { status: 400 });
  }

  try {
    const result = await sql`
      UPDATE ideas SET status = ${newStatus} WHERE id = ${ideaId}
      RETURNING *
    `;
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, idea: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  const { searchParams } = new URL(request.url);
  const ideaId = searchParams.get("ideaId");
  if (!ideaId) return NextResponse.json({ error: "ideaId required" }, { status: 400 });

  try {
    await deleteIdeaCascade(ideaId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}