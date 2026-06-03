import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBillingUserByEmail, hasLaunchAccess, hasProAccess } from "@/lib/billing";

interface IdeaMetricRow {
  id: string;
  name: string;
  category: string;
  stage: string;
  elo_score: number | string;
  wins: number | string;
  losses: number | string;
  battles: number | string;
  category_rank: number | string;
  category_count: number | string;
  category_avg_elo: number | string;
  category_top_elo: number | string;
  elo_delta_30d: number | string;
  profile_views: number | string;
  battle_impressions: number | string;
  cta_clicks: number | string;
  spotlight_impressions: number | string;
  spotlight_clicks: number | string;
  leads: number | string;
  comments: number | string;
  reasons: number | string;
}

function numberValue(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function feedbackForIdea(row: IdeaMetricRow) {
  const wins = numberValue(row.wins);
  const losses = numberValue(row.losses);
  const battles = wins + losses;
  const winRate = battles > 0 ? Math.round((wins / battles) * 100) : 0;
  const categoryAvg = numberValue(row.category_avg_elo);
  const elo = numberValue(row.elo_score);
  const ctaClicks = numberValue(row.cta_clicks);
  const leads = numberValue(row.leads);
  const comments = numberValue(row.comments);
  const reasons = numberValue(row.reasons);
  const notes: string[] = [];

  if (battles < 5) notes.push("Share a challenge link to get enough battles for stronger signal.");
  if (battles >= 5 && winRate < 45) notes.push("The pitch is losing head-to-head; tighten the pain and target customer.");
  if (battles >= 5 && winRate >= 60) notes.push("This is outperforming peers; send traffic to the profile CTA while it has momentum.");
  if (elo < categoryAvg) notes.push("Below category average; compare the top category ideas and sharpen differentiation.");
  if (ctaClicks === 0) notes.push("Add or improve the profile CTA so discovery traffic has somewhere to go.");
  if (ctaClicks > 0 && leads === 0) notes.push("People are clicking but not converting; make the contact ask more specific.");
  if (comments + reasons < 3) notes.push("Ask voters for reasons after battles to build a better feedback set.");

  return notes.slice(0, 3);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to view analytics" }, { status: 401 });
  }

  const user = await getBillingUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!hasLaunchAccess(user.plan)) {
    return NextResponse.json(
      { error: "Paid members can view founder analytics.", upgradeUrl: "/pricing" },
      { status: 402 }
    );
  }

  try {
    const [
      profileResult,
      summaryResult,
      ideasResult,
      voteHistoryResult,
      leadsResult,
      updatesResult,
      digestResult,
    ] = await Promise.all([
      sql`
        SELECT
          id,
          name,
          image,
          profile_headline,
          profile_bio,
          profile_website_url,
          profile_demo_url,
          profile_linkedin_url,
          profile_x_url,
          profile_cta_label,
          profile_cta_url,
          COALESCE(profile_show_contact, true) AS profile_show_contact,
          COALESCE(profile_weekly_digest_opt_in, true) AS profile_weekly_digest_opt_in,
          profile_featured_category
        FROM users
        WHERE id = ${user.id}
      `,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE ae.name = 'founder_profile_viewed' AND ae.metadata->>'profile_user_id' = ${user.id})::int AS profile_views,
          COUNT(*) FILTER (WHERE ae.name = 'paid_member_spotlight_impression' AND ae.metadata->>'member_user_id' = ${user.id})::int AS spotlight_impressions,
          COUNT(*) FILTER (WHERE ae.name = 'paid_member_spotlight_clicked' AND ae.metadata->>'member_user_id' = ${user.id})::int AS spotlight_clicks,
          COUNT(*) FILTER (WHERE ae.name = 'premium_battle_card_viewed' AND ae.metadata->>'member_user_id' = ${user.id})::int AS battle_impressions,
          COUNT(*) FILTER (WHERE ae.name IN ('profile_cta_clicked', 'premium_battle_card_cta_clicked') AND ae.metadata->>'profile_user_id' = ${user.id})::int AS cta_clicks,
          (SELECT COUNT(*)::int FROM founder_leads fl WHERE fl.founder_user_id = ${user.id}) AS leads,
          (SELECT COUNT(*)::int FROM founder_updates fu WHERE fu.user_id = ${user.id}) AS updates
        FROM analytics_events ae
        WHERE ae.created_at >= NOW() - INTERVAL '90 days'
      `,
      sql`
        SELECT
          i.id,
          i.name,
          i.category,
          i.stage,
          i.elo_score,
          i.wins,
          i.losses,
          (i.wins + i.losses)::int AS battles,
          (SELECT COUNT(*) + 1 FROM ideas peer WHERE peer.category = i.category AND peer.elo_score > i.elo_score)::int AS category_rank,
          (SELECT COUNT(*) FROM ideas peer WHERE peer.category = i.category)::int AS category_count,
          COALESCE((SELECT ROUND(AVG(peer.elo_score))::int FROM ideas peer WHERE peer.category = i.category), 1000)::int AS category_avg_elo,
          COALESCE((SELECT MAX(peer.elo_score)::int FROM ideas peer WHERE peer.category = i.category), 1000)::int AS category_top_elo,
          COALESCE((SELECT SUM(h.elo_after - h.elo_before)::int FROM idea_score_history h WHERE h.idea_id = i.id AND h.created_at >= NOW() - INTERVAL '30 days'), 0)::int AS elo_delta_30d,
          COUNT(ae.id) FILTER (WHERE ae.name = 'founder_profile_viewed')::int AS profile_views,
          COUNT(ae.id) FILTER (WHERE ae.name = 'premium_battle_card_viewed')::int AS battle_impressions,
          COUNT(ae.id) FILTER (WHERE ae.name IN ('profile_cta_clicked', 'premium_battle_card_cta_clicked'))::int AS cta_clicks,
          COUNT(ae.id) FILTER (WHERE ae.name = 'paid_member_spotlight_impression')::int AS spotlight_impressions,
          COUNT(ae.id) FILTER (WHERE ae.name = 'paid_member_spotlight_clicked')::int AS spotlight_clicks,
          (SELECT COUNT(*)::int FROM founder_leads fl WHERE fl.idea_id = i.id) AS leads,
          (SELECT COUNT(*)::int FROM comments c WHERE c.idea_id = i.id) AS comments,
          (SELECT COUNT(*)::int FROM votes v WHERE v.winner_id = i.id AND v.reason IS NOT NULL) AS reasons
        FROM ideas i
        LEFT JOIN analytics_events ae
          ON ae.created_at >= NOW() - INTERVAL '90 days'
          AND ae.metadata->>'idea_id' = i.id::text
        WHERE i.user_id = ${user.id}
        GROUP BY i.id
        ORDER BY i.elo_score DESC
      `,
      sql`
        SELECT
          v.created_at,
          own.id AS idea_id,
          own.name AS idea_name,
          opponent.id AS opponent_id,
          opponent.name AS opponent_name,
          winner.name AS winner_name,
          (v.winner_id = own.id) AS won,
          v.prediction_correct,
          v.reason
        FROM votes v
        JOIN battles b ON b.id = v.battle_id
        JOIN LATERAL (
          SELECT i.id, i.name
          FROM ideas i
          WHERE i.user_id = ${user.id}
            AND (i.id = b.idea_a_id OR i.id = b.idea_b_id)
          ORDER BY i.id
          LIMIT 1
        ) own ON TRUE
        JOIN ideas opponent ON opponent.id = CASE WHEN own.id = b.idea_a_id THEN b.idea_b_id ELSE b.idea_a_id END
        JOIN ideas winner ON winner.id = v.winner_id
        ORDER BY v.created_at DESC
        LIMIT 20
      `,
      sql`
        SELECT id, idea_id, email, message, source, created_at
        FROM founder_leads
        WHERE founder_user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 20
      `,
      sql`
        SELECT fu.id, fu.idea_id, i.name AS idea_name, fu.title, fu.body, fu.created_at
        FROM founder_updates fu
        LEFT JOIN ideas i ON i.id = fu.idea_id
        WHERE fu.user_id = ${user.id}
        ORDER BY fu.created_at DESC
        LIMIT 10
      `,
      sql`
        SELECT
          i.id,
          i.name,
          i.category,
          i.elo_score,
          i.wins,
          i.losses,
          COALESCE(SUM(h.elo_after - h.elo_before), 0)::int AS recent_delta
        FROM ideas i
        LEFT JOIN idea_score_history h
          ON h.idea_id = i.id
          AND h.created_at >= NOW() - INTERVAL '7 days'
        WHERE i.user_id = ${user.id}
        GROUP BY i.id
        ORDER BY
          COALESCE(SUM(h.elo_after - h.elo_before), 0) DESC,
          i.elo_score DESC
        LIMIT 5
      `,
    ]);

    const ideas = ideasResult.rows as unknown as IdeaMetricRow[];

    return NextResponse.json({
      plan: user.plan,
      isPro: hasProAccess(user.plan),
      profile: profileResult.rows[0],
      summary: summaryResult.rows[0],
      ideas,
      voteHistory: voteHistoryResult.rows,
      leads: leadsResult.rows,
      updates: updatesResult.rows,
      digest: digestResult.rows,
      feedback: ideas.map((idea) => ({
        idea_id: idea.id,
        idea_name: idea.name,
        notes: feedbackForIdea(idea),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load founder analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
