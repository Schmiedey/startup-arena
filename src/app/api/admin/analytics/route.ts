import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { requireAdmin, adminDenied } from "@/lib/admin";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  const { searchParams } = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(searchParams.get("days")) || 7));

  try {
    const [
      summary,
      byName,
      daily,
      topPages,
      topReferrers,
      funnel,
      recent,
      revenue,
      planBreakdown,
      subscriptionStatuses,
      checkoutByPlan,
      paidUsers,
      paidTimeline,
      featureUsage,
      entitlementAudit,
      paymentEvents,
      botInventory,
    ] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int AS total_events,
          COUNT(DISTINCT ae.client_id)::int AS unique_visitors,
          COUNT(DISTINCT ae.user_id) FILTER (WHERE ae.user_id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false)::int AS signed_in_users,
          COUNT(*) FILTER (WHERE ae.name = 'page_view')::int AS page_views,
          COUNT(*) FILTER (WHERE ae.name = 'session_started')::int AS sessions,
          COUNT(*) FILTER (WHERE ae.name = 'user_signed_up' AND ae.user_id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false)::int AS signups,
          COUNT(*) FILTER (WHERE (ae.name = 'idea_submitted' OR ae.name = 'idea_submit_completed') AND ae.user_id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false)::int AS idea_submits,
          COUNT(*) FILTER (WHERE (ae.name = 'vote_created' OR ae.name = 'vote_completed') AND ae.user_id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false)::int AS votes,
          COUNT(*) FILTER (WHERE ae.name = 'ui_clicked')::int AS clicks,
          COUNT(*) FILTER (WHERE ae.name = 'checkout_started' AND ae.user_id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false)::int AS checkout_started,
          COUNT(*) FILTER (WHERE ae.name = 'checkout_completed' AND ae.user_id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false)::int AS checkout_completed,
          COUNT(*) FILTER (WHERE ae.name = 'client_error')::int AS client_errors
        FROM analytics_events ae
        LEFT JOIN users u ON ae.user_id = u.id
        WHERE ae.created_at >= NOW() - (${days}::int * INTERVAL '1 day')
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
          FROM analytics_events ae
          LEFT JOIN users u ON ae.user_id = u.id
          WHERE ae.created_at >= NOW() - (${days}::int * INTERVAL '1 day') AND ae.name = 'user_signed_up' AND ae.user_id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false
          UNION ALL
          SELECT 3, 'submitted_idea', COUNT(DISTINCT user_id)::int
          FROM analytics_events ae
          LEFT JOIN users u ON ae.user_id = u.id
          WHERE ae.created_at >= NOW() - (${days}::int * INTERVAL '1 day') AND ae.name IN ('idea_submitted', 'idea_submit_completed') AND ae.user_id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false
          UNION ALL
          SELECT 4, 'voted', COUNT(DISTINCT user_id)::int
          FROM analytics_events ae
          LEFT JOIN users u ON ae.user_id = u.id
          WHERE ae.created_at >= NOW() - (${days}::int * INTERVAL '1 day') AND ae.name IN ('vote_created', 'vote_completed') AND ae.user_id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false
          UNION ALL
          SELECT 5, 'started_checkout', COUNT(DISTINCT user_id)::int
          FROM analytics_events ae
          LEFT JOIN users u ON ae.user_id = u.id
          WHERE ae.created_at >= NOW() - (${days}::int * INTERVAL '1 day') AND ae.name = 'checkout_started' AND ae.user_id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false
          UNION ALL
          SELECT 6, 'paid', COUNT(DISTINCT user_id)::int
          FROM analytics_events ae
          LEFT JOIN users u ON ae.user_id = u.id
          WHERE ae.created_at >= NOW() - (${days}::int * INTERVAL '1 day') AND ae.name = 'checkout_completed' AND ae.user_id IS NOT NULL AND COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false
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
      sql`
        WITH paid_events AS (
          SELECT
            name,
            metadata,
            NULLIF(metadata->>'amount_total', '')::int AS amount_cents,
            metadata->>'entitlement' AS entitlement,
            metadata->>'plan' AS plan
          FROM analytics_events
          WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
            AND name IN ('checkout_started', 'checkout_completed')
        ),
        user_plans AS (
          SELECT
            CASE
              WHEN plan = 'pro' AND subscription_status IN ('active', 'trialing') THEN 'pro'
              WHEN launch_pass_purchased_at IS NOT NULL OR plan = 'launch' THEN 'launch'
              ELSE 'free'
            END AS effective_plan,
            subscription_status
          FROM users
          WHERE COALESCE(is_bot, false) = false AND COALESCE(is_admin, false) = false
        )
        SELECT
          COALESCE(SUM(amount_cents) FILTER (WHERE name = 'checkout_completed'), 0)::int AS gross_revenue_cents,
          COALESCE(SUM(amount_cents) FILTER (WHERE name = 'checkout_completed' AND entitlement = 'launch'), 0)::int AS launch_revenue_cents,
          COALESCE(SUM(amount_cents) FILTER (WHERE name = 'checkout_completed' AND entitlement = 'pro'), 0)::int AS pro_revenue_cents,
          COUNT(*) FILTER (WHERE name = 'checkout_started')::int AS checkout_started,
          COUNT(*) FILTER (WHERE name = 'checkout_completed')::int AS checkout_completed,
          COUNT(*) FILTER (WHERE name = 'checkout_completed' AND entitlement = 'launch')::int AS launch_purchases,
          COUNT(*) FILTER (WHERE name = 'checkout_completed' AND entitlement = 'pro')::int AS pro_purchases,
          (SELECT COUNT(*)::int FROM user_plans WHERE effective_plan = 'launch') AS launch_users,
          (SELECT COUNT(*)::int FROM user_plans WHERE effective_plan = 'pro') AS pro_users,
          (SELECT COUNT(*)::int FROM user_plans WHERE effective_plan <> 'free') AS paid_users,
          (SELECT COUNT(*)::int FROM user_plans WHERE subscription_status = 'active') AS active_subscriptions,
          (SELECT COUNT(*)::int FROM user_plans WHERE subscription_status = 'trialing') AS trialing_subscriptions,
          (SELECT COUNT(*)::int FROM user_plans WHERE subscription_status IN ('past_due', 'unpaid', 'incomplete', 'incomplete_expired')) AS attention_subscriptions
        FROM paid_events
      `,
      sql`
        SELECT effective_plan AS plan, COUNT(*)::int AS users
        FROM (
          SELECT
            CASE
              WHEN plan = 'pro' AND subscription_status IN ('active', 'trialing') THEN 'pro'
              WHEN launch_pass_purchased_at IS NOT NULL OR plan = 'launch' THEN 'launch'
              ELSE 'free'
            END AS effective_plan
          FROM users
          WHERE COALESCE(is_bot, false) = false AND COALESCE(is_admin, false) = false
        ) plans
        GROUP BY effective_plan
        ORDER BY CASE effective_plan WHEN 'pro' THEN 1 WHEN 'launch' THEN 2 ELSE 3 END
      `,
      sql`
        SELECT COALESCE(subscription_status, 'none') AS status, COUNT(*)::int AS users
        FROM users
        WHERE COALESCE(is_bot, false) = false AND COALESCE(is_admin, false) = false
        GROUP BY COALESCE(subscription_status, 'none')
        ORDER BY users DESC, status ASC
      `,
      sql`
        SELECT
          COALESCE(metadata->>'plan', metadata->>'entitlement', 'unknown') AS plan,
          COUNT(*) FILTER (WHERE name = 'checkout_started')::int AS started,
          COUNT(*) FILTER (WHERE name = 'checkout_completed')::int AS completed,
          COALESCE(SUM(NULLIF(metadata->>'amount_total', '')::int) FILTER (WHERE name = 'checkout_completed'), 0)::int AS revenue_cents
        FROM analytics_events
        WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
          AND name IN ('checkout_started', 'checkout_completed')
        GROUP BY COALESCE(metadata->>'plan', metadata->>'entitlement', 'unknown')
        ORDER BY started DESC, completed DESC
      `,
      sql`
        SELECT
          u.id,
          u.name,
          u.email,
          CASE
            WHEN u.plan = 'pro' AND u.subscription_status IN ('active', 'trialing') THEN 'pro'
            WHEN u.launch_pass_purchased_at IS NOT NULL OR u.plan = 'launch' THEN 'launch'
            ELSE 'free'
          END AS plan,
          u.subscription_status,
          u.launch_pass_purchased_at,
          u.stripe_customer_id,
          u.stripe_subscription_id,
          u.created_at,
          COUNT(DISTINCT i.id)::int AS ideas,
          COUNT(DISTINCT v.id)::int AS votes,
          MAX(a.created_at) FILTER (WHERE a.name IN ('checkout_completed', 'subscription_updated')) AS last_paid_event_at
        FROM users u
        LEFT JOIN ideas i ON i.user_id = u.id
        LEFT JOIN votes v ON v.user_id = u.id
        LEFT JOIN analytics_events a ON a.user_id = u.id
        WHERE
          COALESCE(u.is_bot, false) = false
          AND COALESCE(u.is_admin, false) = false
          AND (
            u.launch_pass_purchased_at IS NOT NULL
            OR u.plan IN ('launch', 'pro')
            OR u.stripe_customer_id IS NOT NULL
            OR u.stripe_subscription_id IS NOT NULL
          )
        GROUP BY u.id
        ORDER BY COALESCE(MAX(a.created_at) FILTER (WHERE a.name IN ('checkout_completed', 'subscription_updated')), u.launch_pass_purchased_at, u.created_at) DESC
        LIMIT 50
      `,
      sql`
        SELECT
          DATE_TRUNC('day', created_at)::date AS day,
          name,
          COALESCE(metadata->>'entitlement', metadata->>'plan', 'unknown') AS plan,
          COUNT(*)::int AS count,
          COALESCE(SUM(NULLIF(metadata->>'amount_total', '')::int), 0)::int AS revenue_cents
        FROM analytics_events
        WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
          AND name IN ('checkout_started', 'checkout_completed', 'subscription_updated', 'subscription_deleted')
        GROUP BY day, name, COALESCE(metadata->>'entitlement', metadata->>'plan', 'unknown')
        ORDER BY day DESC, name ASC
      `,
      sql`
        SELECT
          name,
          COALESCE(metadata->>'plan', metadata->>'category', metadata->>'method', 'all') AS segment,
          COUNT(*)::int AS count
        FROM analytics_events
        WHERE created_at >= NOW() - (${days}::int * INTERVAL '1 day')
          AND name IN (
            'checkout_cta_clicked',
            'checkout_started',
            'checkout_completed',
            'billing_portal_opened',
            'idea_limit_hit',
            'challenge_share_clicked',
            'challenge_link_upgrade_clicked',
            'category_battle_upgrade_clicked',
            'battle_created'
          )
        GROUP BY name, COALESCE(metadata->>'plan', metadata->>'category', metadata->>'method', 'all')
        ORDER BY count DESC, name ASC
        LIMIT 60
      `,
      sql`
        WITH idea_counts AS (
          SELECT user_id, COUNT(*)::int AS ideas
          FROM ideas
          GROUP BY user_id
        ),
        normalized AS (
          SELECT
            u.id,
            u.email,
            u.plan AS stored_plan,
            CASE
              WHEN u.plan = 'pro' AND u.subscription_status IN ('active', 'trialing') THEN 'pro'
              WHEN u.launch_pass_purchased_at IS NOT NULL OR u.plan = 'launch' THEN 'launch'
              ELSE 'free'
            END AS effective_plan,
            u.subscription_status,
            COALESCE(i.ideas, 0) AS ideas
          FROM users u
          LEFT JOIN idea_counts i ON i.user_id = u.id
          WHERE COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false
        )
        SELECT
          COUNT(*) FILTER (WHERE effective_plan = 'free' AND ideas > 1)::int AS free_over_limit,
          COUNT(*) FILTER (WHERE effective_plan = 'launch' AND ideas > 5)::int AS launch_over_limit,
          COUNT(*) FILTER (WHERE stored_plan = 'pro' AND effective_plan <> 'pro')::int AS pro_without_active_subscription,
          COUNT(*) FILTER (WHERE effective_plan = 'pro' AND subscription_status NOT IN ('active', 'trialing'))::int AS pro_status_mismatch,
          COUNT(*) FILTER (WHERE effective_plan = 'launch' AND ideas <= 5)::int AS launch_limit_ok,
          COUNT(*) FILTER (WHERE effective_plan = 'pro')::int AS pro_unlimited_ok
        FROM normalized
      `,
      sql`
        SELECT name, user_id, path, metadata, created_at
        FROM analytics_events
        WHERE name IN ('checkout_started', 'checkout_completed', 'subscription_updated', 'subscription_deleted', 'billing_portal_opened')
        ORDER BY created_at DESC
        LIMIT 60
      `,
      sql`
        SELECT
          (SELECT COUNT(*) FROM users WHERE COALESCE(is_bot, false) = true)::int AS users,
          (SELECT COUNT(*) FROM ideas i LEFT JOIN users u ON i.user_id = u.id WHERE u.id IS NULL OR COALESCE(u.is_bot, false) = true OR COALESCE(u.is_admin, false) = true)::int AS ideas,
          (SELECT COUNT(*) FROM votes v LEFT JOIN users u ON v.user_id = u.id WHERE u.id IS NULL OR COALESCE(u.is_bot, false) = true OR COALESCE(u.is_admin, false) = true)::int AS votes,
          (SELECT COUNT(*) FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE u.id IS NULL OR COALESCE(u.is_bot, false) = true OR COALESCE(u.is_admin, false) = true)::int AS comments,
          (SELECT COUNT(*) FROM users WHERE COALESCE(is_bot, false) = true AND (prediction_wins + prediction_losses) > 0)::int AS predictors
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
      revenue: revenue.rows[0],
      planBreakdown: planBreakdown.rows,
      subscriptionStatuses: subscriptionStatuses.rows,
      checkoutByPlan: checkoutByPlan.rows,
      paidUsers: paidUsers.rows,
      paidTimeline: paidTimeline.rows,
      featureUsage: featureUsage.rows,
      entitlementAudit: entitlementAudit.rows[0],
      paymentEvents: paymentEvents.rows,
      botInventory: botInventory.rows[0],
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
