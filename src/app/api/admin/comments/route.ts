import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { requireAdmin, adminDenied } from "@/lib/admin";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;

  try {
    const [comments, count] = await Promise.all([
      sql`SELECT c.id, c.body, c.created_at,
          u.name as user_name, u.email as user_email, u.id as user_id,
          i.name as idea_name, i.id as idea_id
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          JOIN ideas i ON c.idea_id = i.id
          ORDER BY c.created_at DESC
          LIMIT ${limit} OFFSET ${offset}`,
      sql`SELECT COUNT(*) as count FROM comments`,
    ]);

    return NextResponse.json({
      comments: comments.rows,
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
  const commentId = searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  try {
    await sql`DELETE FROM comments WHERE id = ${commentId}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}