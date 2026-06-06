import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/types";

function cleanLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 6;
  return Math.min(12, Math.max(1, Math.trunc(parsed)));
}

function isCategory(value: string | null) {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = cleanLimit(searchParams.get("limit"));

  if (category && !isCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    const result = category
      ? await sql`
          WITH paid_users AS (
            SELECT
              u.*,
              CASE
                WHEN u.plan = 'pro' AND u.subscription_status IN ('active', 'trialing') THEN 'pro'
                WHEN u.launch_pass_purchased_at IS NOT NULL OR u.plan = 'launch' THEN 'launch'
                ELSE 'free'
              END AS effective_plan
            FROM users u
            WHERE COALESCE(u.is_bot, false) = false
              AND COALESCE(u.is_admin, false) = false
          )
          SELECT
            pu.id,
            pu.name,
            pu.image,
            pu.effective_plan AS plan,
            pu.profile_headline,
            pu.profile_bio,
            pu.profile_cta_label,
            pu.profile_cta_url,
            pu.profile_featured_category,
            pu.profile_weekly_digest_opt_in,
            featured.id AS idea_id,
            featured.name AS idea_name,
            featured.pitch AS idea_pitch,
            featured.category AS idea_category,
            featured.stage AS idea_stage,
            featured.elo_score AS idea_elo_score,
            stats.ideas_count,
            stats.best_elo,
            stats.total_wins,
            stats.total_losses,
            last_seen.last_impression_at
          FROM paid_users pu
          LEFT JOIN LATERAL (
            SELECT i.id, i.name, i.pitch, i.category, i.stage, i.elo_score
            FROM ideas i
            WHERE i.user_id = pu.id
              AND i.category = ${category}
            ORDER BY
              CASE WHEN pu.profile_featured_category = ${category} THEN 0 ELSE 1 END,
              i.elo_score DESC,
              i.created_at DESC
            LIMIT 1
          ) featured ON TRUE
          JOIN LATERAL (
            SELECT
              COUNT(*)::int AS ideas_count,
              COALESCE(MAX(i.elo_score), 1000)::int AS best_elo,
              COALESCE(SUM(i.wins), 0)::int AS total_wins,
              COALESCE(SUM(i.losses), 0)::int AS total_losses
            FROM ideas i
            WHERE i.user_id = pu.id
          ) stats ON TRUE
          LEFT JOIN LATERAL (
            SELECT MAX(ae.created_at) AS last_impression_at
            FROM analytics_events ae
            WHERE ae.name = 'paid_member_spotlight_impression'
              AND ae.metadata->>'member_user_id' = pu.id::text
              AND ae.metadata->>'category' = ${category}
          ) last_seen ON TRUE
          WHERE pu.effective_plan <> 'free'
            AND (featured.id IS NOT NULL OR pu.profile_featured_category = ${category})
          ORDER BY
            CASE WHEN pu.effective_plan = 'pro' THEN 0 ELSE 1 END,
            last_seen.last_impression_at ASC NULLS FIRST,
            RANDOM()
          LIMIT ${limit}
        `
      : await sql`
          WITH paid_users AS (
            SELECT
              u.*,
              CASE
                WHEN u.plan = 'pro' AND u.subscription_status IN ('active', 'trialing') THEN 'pro'
                WHEN u.launch_pass_purchased_at IS NOT NULL OR u.plan = 'launch' THEN 'launch'
                ELSE 'free'
              END AS effective_plan
            FROM users u
            WHERE COALESCE(u.is_bot, false) = false
              AND COALESCE(u.is_admin, false) = false
          )
          SELECT
            pu.id,
            pu.name,
            pu.image,
            pu.effective_plan AS plan,
            pu.profile_headline,
            pu.profile_bio,
            pu.profile_cta_label,
            pu.profile_cta_url,
            pu.profile_featured_category,
            pu.profile_weekly_digest_opt_in,
            featured.id AS idea_id,
            featured.name AS idea_name,
            featured.pitch AS idea_pitch,
            featured.category AS idea_category,
            featured.stage AS idea_stage,
            featured.elo_score AS idea_elo_score,
            stats.ideas_count,
            stats.best_elo,
            stats.total_wins,
            stats.total_losses,
            last_seen.last_impression_at
          FROM paid_users pu
          LEFT JOIN LATERAL (
            SELECT i.id, i.name, i.pitch, i.category, i.stage, i.elo_score
            FROM ideas i
            WHERE i.user_id = pu.id
            ORDER BY
              CASE WHEN pu.profile_featured_category IS NOT NULL AND i.category = pu.profile_featured_category THEN 0 ELSE 1 END,
              i.elo_score DESC,
              i.created_at DESC
            LIMIT 1
          ) featured ON TRUE
          JOIN LATERAL (
            SELECT
              COUNT(*)::int AS ideas_count,
              COALESCE(MAX(i.elo_score), 1000)::int AS best_elo,
              COALESCE(SUM(i.wins), 0)::int AS total_wins,
              COALESCE(SUM(i.losses), 0)::int AS total_losses
            FROM ideas i
            WHERE i.user_id = pu.id
          ) stats ON TRUE
          LEFT JOIN LATERAL (
            SELECT MAX(ae.created_at) AS last_impression_at
            FROM analytics_events ae
            WHERE ae.name = 'paid_member_spotlight_impression'
              AND ae.metadata->>'member_user_id' = pu.id::text
              AND COALESCE(ae.metadata->>'category', 'all') = 'all'
          ) last_seen ON TRUE
          WHERE pu.effective_plan <> 'free'
          ORDER BY
            CASE WHEN pu.effective_plan = 'pro' THEN 0 ELSE 1 END,
            last_seen.last_impression_at ASC NULLS FIRST,
            RANDOM()
          LIMIT ${limit}
        `;

    return NextResponse.json(result.rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load featured members";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
