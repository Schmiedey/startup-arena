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
    const [votes, count] = await Promise.all([
      sql`SELECT v.id, v.reason, v.created_at, 
          u.name as voter_name, u.email as voter_email,
          winner.name as winner_name, winner.elo_score as winner_elo,
          loser.name as loser_name, loser.elo_score as loser_elo,
          v.battle_id
          FROM votes v
          LEFT JOIN users u ON v.user_id = u.id
          JOIN ideas winner ON v.winner_id = winner.id
          JOIN battles b ON v.battle_id = b.id
          JOIN ideas loser ON (
            CASE WHEN v.winner_id = b.idea_a_id THEN b.idea_b_id ELSE b.idea_a_id END = loser.id
          )
          WHERE v.reason IS NOT NULL
          ORDER BY v.created_at DESC
          LIMIT ${limit} OFFSET ${offset}`,
      sql`SELECT COUNT(*) as count FROM votes WHERE reason IS NOT NULL`,
    ]);

    return NextResponse.json({
      votes: votes.rows,
      total: Number(count.rows[0].count),
      page,
      totalPages: Math.ceil(Number(count.rows[0].count) / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}