import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const userResult = await sql`
      SELECT id, name, email, image, created_at FROM users WHERE id = ${userId}
    `;
    const user = userResult.rows[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ideasResult = await sql`
      SELECT id, name, pitch, category, stage, elo_score, wins, losses, created_at
      FROM ideas WHERE user_id = ${userId} ORDER BY elo_score DESC
    `;

    const statsResult = await sql`
      SELECT
        COUNT(*) as total_ideas,
        COALESCE(SUM(wins), 0) as total_wins,
        COALESCE(SUM(losses), 0) as total_losses,
        COALESCE(MAX(elo_score), 1000) as max_elo
      FROM ideas WHERE user_id = ${userId}
    `;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        created_at: user.created_at,
      },
      ideas: ideasResult.rows,
      stats: statsResult.rows[0],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Query failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}