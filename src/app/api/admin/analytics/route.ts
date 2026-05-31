import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { requireAdmin, adminDenied } from "@/lib/admin";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  const { searchParams } = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(searchParams.get("days")) || 7));

  try {
    const [summary, byName, daily, topPages, topReferrers, funnel, recent] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int as total_events,
          COUNT(DISTINCT client_id)::int as unique_visitors,
          COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int as signed_in_users,
          COUNT(*) FILTER (WHERE name = 'page_view')::int as page_views,
          COUNT(*) FILTER (WHERE name = 'session_started')::int as sessions,
          COUNT(*) FILTER (WHERE name = 'user_signed_up')::int as signups,
          COUNT(*) FILTER (WHERE name = 'idea_submitted' OR name = 'idea_submit_completed')::int as idea_submits,
          COUNT(*) FILTER (WHERE name = 'vote_created' OR name = 'vote_completed')::int as votes,
          COUNT(*) FILTER (WHERE name = 'ui_clicked')::int as clicks,
          COUNT(*) FILTER (WHERE name = 'checkout_started')::int as checkout_started,
          COUNT(*) FILTER (WHERE name = 'checkout_completed')::int as checkout_completed,
          COUNT(*) FILTER (WHERE name = 'client_error')::int as client_errors
        FROM analytics_events
        WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
      `,
      sql`
        SELECT name, COUNT(*)::int as count
        FROM analytics_events
        WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
        GROUP BY name
        ORDER BY count DESC, name ASC
        LIMIT 50
      `,
      sql`
        SELECT DATE_TRUNC('day', created_at)::date as day, name, COUNT(*)::int as count
        FROM analytics_events
        WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
          AND name IN ('page_view', 'user_signed_up', 'idea_submitted', 'vote_created', 'checkout_started', 'checkout_completed')
        GROUP BY day, name
        ORDER BY day ASC, name ASC
      `,
      sql`
        SELECT COALESCE(path, '(unknown)') as path, COUNT(*)::int as count
        FROM analytics_events
        WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
          AND name = 'page_view'
        GROUP BY path
        ORDER BY count DESC
        LIMIT 20
      `,
      sql`
        SELECT COALESCE(NULLIF(referrer, ''), '(direct)') as referrer, COUNT(*)::int as count
        FROM analytics_events
        WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
          AND name = 'page_view'
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 12
      `,
      sql`
        SELECT *
        FROM (
          SELECT 1 as step_order, 'visited' as step, COUNT(DISTINCT client_id)::int as count
          FROM analytics_events
          WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day') AND name = 'page_view'
          UNION ALL
          SELECT 2, 'signed_up', COUNT(DISTINCT user_id)::int
          FROM analytics_events
          WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day') AND name = 'user_signed_up'
          UNION ALL
          SELECT 3, 'submitted_idea', COUNT(DISTINCT user_id)::int
          FROM analytics_events
          WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day') AND name IN ('idea_submitted', 'idea_submit_completed')
          UNION ALL
          SELECT 4, 'voted', COUNT(DISTINCT user_id)::int
          FROM analytics_events
          WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day') AND name IN ('vote_created', 'vote_completed')
          UNION ALL
          SELECT 5, 'started_checkout', COUNT(DISTINCT user_id)::int
          FROM analytics_events
          WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day') AND name = 'checkout_started'
          UNION ALL
          SELECT 6, 'paid', COUNT(DISTINCT user_id)::int
          FROM analytics_events
          WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day') AND name = 'checkout_completed'
        ) as funnel
        ORDER BY step_order ASC
      `,
      sql`
        SELECT name, path, metadata, created_at
        FROM analytics_events
        WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
        ORDER BY created_at DESC
        LIMIT 40
      `,
    ]);

    return NextResponse.json({
      days,
      summary: summary.rows[0],
      byName: byName.rows,
      daily: daily.rows,
      topPages: topPages.rows,
      topReferrers: topReferrers.rows,
      funnel: funnel.rows,
      recent: recent.rows,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
