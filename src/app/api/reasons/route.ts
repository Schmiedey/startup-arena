import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ideaId = searchParams.get("idea_id");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  if (!ideaId) {
    return NextResponse.json({ error: "idea_id is required" }, { status: 400 });
  }

  try {
    const result = await sql`
      SELECT v.reason, v.created_at, u.name, u.image
      FROM votes v
      JOIN ideas i ON v.winner_id = i.id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.winner_id = ${ideaId} AND v.reason IS NOT NULL
      ORDER BY v.created_at DESC
      LIMIT ${limit}
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch reasons";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}