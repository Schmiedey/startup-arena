import { sql } from "@vercel/postgres";
import { cache } from "react";
import { getSurvivalRating, getWinRate } from "@/lib/elo";
import { extractEntityId, isUuid } from "@/lib/seo";

export interface ShareIdea {
  id: string;
  user_id: string | null;
  name: string;
  pitch: string;
  target_customer: string;
  problem: string;
  revenue_model: string;
  category: string;
  stage: string;
  elo_score: number;
  wins: number;
  losses: number;
  created_at: string;
  user_name: string | null;
}

export interface ShareBattle {
  id: string;
  created_at: string;
  idea_a: ShareIdea;
  idea_b: ShareIdea;
  winner: ShareIdea | null;
  loser: ShareIdea | null;
}

export interface ShareFounder {
  id: string;
  name: string | null;
  image: string | null;
  created_at: string;
  ideas_count: number;
  total_wins: number;
  total_losses: number;
  best_elo: number;
  votes_cast: number;
  karma: number;
}

export const getShareIdea = cache(async (id: string): Promise<ShareIdea | null> => {
  const ideaId = extractEntityId(id);
  if (!isUuid(ideaId)) return null;

  const result = await sql`
    SELECT
      i.id,
      i.user_id,
      i.name,
      i.pitch,
      i.target_customer,
      i.problem,
      i.revenue_model,
      i.category,
      i.stage,
      i.elo_score,
      i.wins,
      i.losses,
      i.created_at,
      u.name as user_name
    FROM ideas i
    LEFT JOIN users u ON i.user_id = u.id
    WHERE i.id = ${ideaId}
  `;

  return result.rows[0] as ShareIdea | undefined ?? null;
});

export const getShareBattle = cache(async (id: string): Promise<ShareBattle | null> => {
  const battleId = extractEntityId(id);
  if (!isUuid(battleId)) return null;

  const battleResult = await sql`
    SELECT id, idea_a_id, idea_b_id, winner_id, created_at
    FROM battles
    WHERE id = ${battleId}
  `;
  const battle = battleResult.rows[0];
  if (!battle) return null;

  const [ideaA, ideaB] = await Promise.all([
    getShareIdea(battle.idea_a_id),
    getShareIdea(battle.idea_b_id),
  ]);

  if (!ideaA || !ideaB) return null;

  const winner = battle.winner_id === ideaA.id ? ideaA : battle.winner_id === ideaB.id ? ideaB : null;
  const loser = winner?.id === ideaA.id ? ideaB : winner?.id === ideaB.id ? ideaA : null;

  return {
    id: battle.id,
    created_at: battle.created_at,
    idea_a: ideaA,
    idea_b: ideaB,
    winner,
    loser,
  };
});

export const getShareFounder = cache(async (id: string): Promise<ShareFounder | null> => {
  const founderId = extractEntityId(id);
  if (!isUuid(founderId)) return null;

  const result = await sql`
    SELECT
      u.id,
      u.name,
      u.image,
      u.created_at,
      COUNT(i.id)::int as ideas_count,
      COALESCE(SUM(i.wins), 0)::int as total_wins,
      COALESCE(SUM(i.losses), 0)::int as total_losses,
      COALESCE(MAX(i.elo_score), 1000)::int as best_elo,
      COALESCE(v_stats.votes_cast, 0)::int as votes_cast,
      (
        COALESCE(SUM(i.wins), 0) * 5
        + COALESCE(v_stats.votes_cast, 0)
        + COUNT(i.id) * 10
      )::int as karma
    FROM users u
    LEFT JOIN ideas i ON i.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*)::int AS votes_cast
      FROM votes
      GROUP BY user_id
    ) v_stats ON u.id = v_stats.user_id
    WHERE u.id = ${founderId}
    GROUP BY u.id, v_stats.votes_cast
  `;

  return result.rows[0] as ShareFounder | undefined ?? null;
});

export function ideaShareDescription(idea: ShareIdea): string {
  const survival = getSurvivalRating(idea.elo_score);
  const winRate = getWinRate(idea.wins, idea.losses);
  return `${survival}% survival rating, ${winRate}% win rate. ${idea.pitch}`;
}

export function founderShareDescription(founder: ShareFounder): string {
  const totalBattles = founder.total_wins + founder.total_losses;
  const winRate = totalBattles > 0 ? Math.round((founder.total_wins / totalBattles) * 100) : 0;
  const name = founder.name ?? "This founder";
  return `${name} has ${founder.ideas_count} startup ideas on Likelyr, ${founder.karma} karma, a ${winRate}% founder win rate, and a best Elo of ${founder.best_elo}.`;
}
