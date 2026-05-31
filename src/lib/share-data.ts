import { sql } from "@vercel/postgres";
import { cache } from "react";
import { getSurvivalRating, getWinRate } from "@/lib/elo";

export interface ShareIdea {
  id: string;
  name: string;
  pitch: string;
  category: string;
  stage: string;
  elo_score: number;
  wins: number;
  losses: number;
  user_name: string | null;
}

export interface ShareBattle {
  id: string;
  idea_a: ShareIdea;
  idea_b: ShareIdea;
  winner: ShareIdea | null;
  loser: ShareIdea | null;
}

export const getShareIdea = cache(async (id: string): Promise<ShareIdea | null> => {
  const result = await sql`
    SELECT i.id, i.name, i.pitch, i.category, i.stage, i.elo_score, i.wins, i.losses, u.name as user_name
    FROM ideas i
    LEFT JOIN users u ON i.user_id = u.id
    WHERE i.id = ${id}
  `;

  return result.rows[0] as ShareIdea | undefined ?? null;
});

export const getShareBattle = cache(async (id: string): Promise<ShareBattle | null> => {
  const battleResult = await sql`
    SELECT id, idea_a_id, idea_b_id, winner_id
    FROM battles
    WHERE id = ${id}
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
    idea_a: ideaA,
    idea_b: ideaB,
    winner,
    loser,
  };
});

export function ideaShareDescription(idea: ShareIdea): string {
  const survival = getSurvivalRating(idea.elo_score);
  const winRate = getWinRate(idea.wins, idea.losses);
  return `${survival}% survival rating, ${winRate}% win rate. Think ${idea.name} is likelier to succeed?`;
}
