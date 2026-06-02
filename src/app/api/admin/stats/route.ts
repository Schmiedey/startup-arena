import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { requireAdmin, adminDenied } from "@/lib/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  try {
    const [users, ideas, votes, battles, comments, today, botStats] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users WHERE COALESCE(is_bot, false) = false AND COALESCE(is_admin, false) = false`,
      sql`
        SELECT COUNT(*) as count
        FROM ideas i
        LEFT JOIN users u ON i.user_id = u.id
        WHERE u.id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false
      `,
      sql`
        SELECT COUNT(*) as count
        FROM votes v
        LEFT JOIN users u ON v.user_id = u.id
        WHERE u.id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false
      `,
      sql`
        SELECT COUNT(DISTINCT b.id) as count
        FROM battles b
        JOIN ideas ia ON b.idea_a_id = ia.id
        JOIN ideas ib ON b.idea_b_id = ib.id
        LEFT JOIN users ua ON ia.user_id = ua.id
        LEFT JOIN users ub ON ib.user_id = ub.id
        WHERE
          (ua.id IS NOT NULL AND COALESCE(ua.is_bot, false) = false AND COALESCE(ua.is_admin, false) = false)
          OR (ub.id IS NOT NULL AND COALESCE(ub.is_bot, false) = false AND COALESCE(ub.is_admin, false) = false)
      `,
      sql`
        SELECT COUNT(*) as count
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE u.id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false
      `,
      sql`SELECT 
        (SELECT COUNT(*) FROM users WHERE COALESCE(is_bot, false) = false AND COALESCE(is_admin, false) = false AND created_at >= NOW() - INTERVAL '1 day') as new_users,
        (SELECT COUNT(*) FROM ideas i LEFT JOIN users u ON i.user_id = u.id WHERE u.id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false AND i.created_at >= NOW() - INTERVAL '1 day') as new_ideas,
        (SELECT COUNT(*) FROM votes v LEFT JOIN users u ON v.user_id = u.id WHERE u.id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false AND v.created_at >= NOW() - INTERVAL '1 day') as new_votes,
        (SELECT COUNT(*) FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE u.id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false AND c.created_at >= NOW() - INTERVAL '1 day') as new_comments
      `,
      sql`SELECT
        (SELECT COUNT(*) FROM users WHERE COALESCE(is_bot, false) = true)::int AS users,
        (SELECT COUNT(*) FROM ideas i LEFT JOIN users u ON i.user_id = u.id WHERE u.id IS NULL OR COALESCE(u.is_bot, false) = true OR COALESCE(u.is_admin, false) = true)::int AS ideas,
        (SELECT COUNT(*) FROM votes v LEFT JOIN users u ON v.user_id = u.id WHERE u.id IS NULL OR COALESCE(u.is_bot, false) = true OR COALESCE(u.is_admin, false) = true)::int AS votes,
        (SELECT COUNT(*) FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE u.id IS NULL OR COALESCE(u.is_bot, false) = true OR COALESCE(u.is_admin, false) = true)::int AS comments,
        (
          SELECT COUNT(DISTINCT b.id)
          FROM battles b
          JOIN ideas ia ON b.idea_a_id = ia.id
          JOIN ideas ib ON b.idea_b_id = ib.id
          JOIN users ua ON ia.user_id = ua.id
          JOIN users ub ON ib.user_id = ub.id
          WHERE NOT (
            (ua.id IS NOT NULL AND COALESCE(ua.is_bot, false) = false AND COALESCE(ua.is_admin, false) = false)
            OR (ub.id IS NOT NULL AND COALESCE(ub.is_bot, false) = false AND COALESCE(ub.is_admin, false) = false)
          )
        )::int AS battles,
        (SELECT COUNT(*) FROM users WHERE COALESCE(is_bot, false) = true AND (prediction_wins + prediction_losses) > 0)::int AS predictors
      `,
    ]);

    const topIdeas = await sql`
      SELECT i.id, i.name, i.elo_score, i.wins, i.losses, u.name as founder, COALESCE(u.is_bot, true) as is_bot
      FROM ideas i LEFT JOIN users u ON i.user_id = u.id
      ORDER BY i.elo_score DESC LIMIT 5
    `;

    const categoryBreakdown = await sql`
      SELECT category, COUNT(*) as count, ROUND(AVG(elo_score)::numeric, 0) as avg_elo
      FROM ideas GROUP BY category ORDER BY count DESC
    `;

    const recentActivity = await sql`
      (SELECT 'vote' as type, v.created_at, u.name as user_name, i.name as idea_name, COALESCE(u.is_bot, false) as is_bot FROM votes v 
        JOIN users u ON v.user_id = u.id JOIN ideas i ON v.winner_id = i.id ORDER BY v.created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'idea' as type, i2.created_at, u2.name as user_name, i2.name as idea_name, COALESCE(u2.is_bot, false) as is_bot FROM ideas i2 
        JOIN users u2 ON i2.user_id = u2.id ORDER BY i2.created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'comment' as type, c.created_at, u3.name as user_name, i3.name as idea_name, COALESCE(u3.is_bot, false) as is_bot FROM comments c 
        JOIN users u3 ON c.user_id = u3.id JOIN ideas i3 ON c.idea_id = i3.id ORDER BY c.created_at DESC LIMIT 5)
      ORDER BY created_at DESC LIMIT 10
    `;

    return NextResponse.json({
      stats: {
        users: Number(users.rows[0].count),
        ideas: Number(ideas.rows[0].count),
        votes: Number(votes.rows[0].count),
        battles: Number(battles.rows[0].count),
        comments: Number(comments.rows[0].count),
        newUsersToday: Number(today.rows[0].new_users),
        newIdeasToday: Number(today.rows[0].new_ideas),
        newVotesToday: Number(today.rows[0].new_votes),
        newCommentsToday: Number(today.rows[0].new_comments),
      },
      botStats: botStats.rows[0],
      topIdeas: topIdeas.rows,
      categoryBreakdown: categoryBreakdown.rows,
      recentActivity: recentActivity.rows,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
