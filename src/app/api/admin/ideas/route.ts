import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { requireAdmin, adminDenied } from "@/lib/admin";
import { deleteIdeaCascade } from "@/lib/db";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;

  try {
    let ideas, count;
    if (search) {
      const pat = `%${search}%`;
      [ideas, count] = await Promise.all([
        sql`SELECT i.*, u.name as user_name FROM ideas i LEFT JOIN users u ON i.user_id = u.id
            WHERE i.name ILIKE ${pat} OR i.pitch ILIKE ${pat}
            ORDER BY i.elo_score DESC LIMIT ${limit} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM ideas WHERE name ILIKE ${pat} OR pitch ILIKE ${pat}`,
      ]);
    } else {
      [ideas, count] = await Promise.all([
        sql`SELECT i.*, u.name as user_name FROM ideas i LEFT JOIN users u ON i.user_id = u.id
            ORDER BY i.elo_score DESC LIMIT ${limit} OFFSET ${offset}`,
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
