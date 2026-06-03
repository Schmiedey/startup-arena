import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await sql`
      SELECT
        u.id,
        u.name,
        u.image,
        COALESCE(u.is_bot, false) AS is_bot,
        CASE
          WHEN u.plan = 'pro' AND u.subscription_status IN ('active', 'trialing') THEN 'pro'
          WHEN u.launch_pass_purchased_at IS NOT NULL OR u.plan = 'launch' THEN 'launch'
          ELSE 'free'
        END AS plan,
        u.profile_headline,
        u.created_at,
        COALESCE(i_stats.ideas_count, 0) AS ideas_count,
        COALESCE(i_stats.total_wins, 0) AS total_wins,
        COALESCE(i_stats.total_losses, 0) AS total_losses,
        COALESCE(i_stats.best_elo, 1000) AS best_elo,
        COALESCE(v_stats.votes_cast, 0) AS votes_cast,
        (
          COALESCE(i_stats.total_wins, 0) * 5
          + COALESCE(v_stats.votes_cast, 0) * 1
          + COALESCE(i_stats.ideas_count, 0) * 10
        ) AS karma
      FROM users u
      LEFT JOIN (
        SELECT
          user_id,
          COUNT(*) AS ideas_count,
          SUM(wins) AS total_wins,
          SUM(losses) AS total_losses,
          MAX(elo_score) AS best_elo
        FROM ideas
        GROUP BY user_id
      ) i_stats ON u.id = i_stats.user_id
      LEFT JOIN (
        SELECT
          user_id,
          COUNT(*) AS votes_cast
        FROM votes
        GROUP BY user_id
      ) v_stats ON u.id = v_stats.user_id
      WHERE
        (
          COALESCE(u.is_bot, false) = true
          OR u.launch_pass_purchased_at IS NOT NULL
          OR u.plan = 'launch'
          OR (u.plan = 'pro' AND u.subscription_status IN ('active', 'trialing'))
        )
        AND (i_stats.ideas_count IS NOT NULL OR v_stats.votes_cast IS NOT NULL)
      ORDER BY karma DESC NULLS LAST
      LIMIT 50
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch founders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
