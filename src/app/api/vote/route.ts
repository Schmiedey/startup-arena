import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { calculateElo } from "@/lib/elo";
import { checkBanned, bannedResponse } from "@/lib/admin";
import { withTransaction } from "@/lib/db";
import { publicTextError } from "@/lib/moderation";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";
import {
  DEFAULT_PREDICTION_ELO,
  calculatePredictionElo,
  getPredictionDifficulty,
  getPredictionTarget,
  isRankedPredictionSignal,
} from "@/lib/prediction";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to vote" }, { status: 401 });
  }

  const banCheck = await checkBanned();
  if (banCheck?.banned) return bannedResponse();

  const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = userResult.rows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limited = await rateLimit(request, {
    name: "vote_create",
    limit: 120,
    windowSeconds: 600,
    identity: rateLimitIdentity(request, user.id),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Too many votes. Take a short break and try again.");

  const { battle_id, winner_id, reason } = await request.json();

  if (!battle_id || !winner_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const result = await withTransaction(async (client) => {
      const battleResult = await client.sql`
        SELECT idea_a_id, idea_b_id, idea_a_votes, idea_b_votes FROM battles WHERE id = ${battle_id} FOR UPDATE
      `;
      const battle = battleResult.rows[0];
      if (!battle) {
        return { error: "Battle not found", status: 404 as const };
      }

      if (winner_id !== battle.idea_a_id && winner_id !== battle.idea_b_id) {
        return { error: "Invalid winner for this battle", status: 400 as const };
      }

      const loserId = winner_id === battle.idea_a_id ? battle.idea_b_id : battle.idea_a_id;

      const ideaAResult = await client.sql`SELECT * FROM ideas WHERE id = ${battle.idea_a_id} FOR UPDATE`;
      const ideaBResult = await client.sql`SELECT * FROM ideas WHERE id = ${battle.idea_b_id} FOR UPDATE`;
      const ideaA = ideaAResult.rows[0];
      const ideaB = ideaBResult.rows[0];

      if (!ideaA || !ideaB) {
        return { error: "Idea not found", status: 404 as const };
      }

      if (ideaA.user_id === user.id || ideaB.user_id === user.id) {
        return { error: "You cannot vote on your own idea", status: 403 as const };
      }

      const trimmedReason = typeof reason === "string" ? reason.trim().slice(0, 500) : null;
      if (trimmedReason) {
        const spamError = publicTextError(trimmedReason, { maxUrls: 1 });
        if (spamError) return { error: spamError, status: 400 as const };
      }

      const crowdSignalTargetId = getPredictionTarget({
        ideaAId: battle.idea_a_id,
        ideaBId: battle.idea_b_id,
        ideaAVotes: Number(battle.idea_a_votes ?? 0),
        ideaBVotes: Number(battle.idea_b_votes ?? 0),
        ideaAElo: Number(ideaA.elo_score),
        ideaBElo: Number(ideaB.elo_score),
      });
      const predictionDifficulty = getPredictionDifficulty({
        ideaAVotes: Number(battle.idea_a_votes ?? 0),
        ideaBVotes: Number(battle.idea_b_votes ?? 0),
        ideaAElo: Number(ideaA.elo_score),
        ideaBElo: Number(ideaB.elo_score),
      });
      const predictionRanked = isRankedPredictionSignal({
        ideaAVotes: Number(battle.idea_a_votes ?? 0),
        ideaBVotes: Number(battle.idea_b_votes ?? 0),
        ideaAElo: Number(ideaA.elo_score),
        ideaBElo: Number(ideaB.elo_score),
      });
      const predictionTargetId = crowdSignalTargetId ?? winner_id;
      const predictionCorrect = crowdSignalTargetId === null ? null : winner_id === crowdSignalTargetId;

      const voterResult = await client.sql`
        SELECT prediction_elo, prediction_wins, prediction_losses, prediction_streak, best_prediction_streak
        FROM users WHERE id = ${user.id} FOR UPDATE
      `;
      const voter = voterResult.rows[0];
      const voterEloBefore = Number(voter?.prediction_elo ?? DEFAULT_PREDICTION_ELO);
      const voterEloAfter = predictionRanked && predictionCorrect !== null
        ? calculatePredictionElo(voterEloBefore, predictionDifficulty, predictionCorrect)
        : voterEloBefore;
      const currentPredictionStreak = Number(voter?.prediction_streak ?? 0);
      const predictionStreak = predictionRanked && predictionCorrect !== null
        ? predictionCorrect
          ? currentPredictionStreak + 1
          : 0
        : currentPredictionStreak;
      const bestPredictionStreak = Math.max(Number(voter?.best_prediction_streak ?? 0), predictionStreak);

      await client.sql`
        INSERT INTO votes (
          battle_id,
          user_id,
          winner_id,
          prediction_target_id,
          prediction_correct,
          prediction_ranked,
          voter_elo_before,
          voter_elo_after,
          reason
        )
        VALUES (
          ${battle_id},
          ${user.id},
          ${winner_id},
          ${predictionTargetId},
          ${predictionCorrect},
          ${predictionRanked},
          ${voterEloBefore},
          ${voterEloAfter},
          ${trimmedReason}
        )
      `;

      const winner = winner_id === battle.idea_a_id ? ideaA : ideaB;
      const loser = loserId === battle.idea_a_id ? ideaA : ideaB;

      const { newWinnerRating, newLoserRating } = calculateElo(winner.elo_score, loser.elo_score);
      const isAWinner = winner_id === battle.idea_a_id;

      await client.sql`UPDATE ideas SET elo_score = ${newWinnerRating}, wins = wins + 1 WHERE id = ${winner_id}`;
      await client.sql`UPDATE ideas SET elo_score = ${newLoserRating}, losses = losses + 1 WHERE id = ${loserId}`;
      await client.sql`
        UPDATE battles SET winner_id = ${winner_id},
          idea_a_votes = idea_a_votes + ${isAWinner ? 1 : 0},
          idea_b_votes = idea_b_votes + ${isAWinner ? 0 : 1}
        WHERE id = ${battle_id}
      `;
      await client.sql`
        UPDATE users SET
          prediction_elo = ${voterEloAfter},
          prediction_wins = prediction_wins + ${predictionRanked && predictionCorrect === true ? 1 : 0},
          prediction_losses = prediction_losses + ${predictionRanked && predictionCorrect === false ? 1 : 0},
          prediction_streak = ${predictionStreak},
          best_prediction_streak = ${bestPredictionStreak}
        WHERE id = ${user.id}
      `;
      await client.sql`
        INSERT INTO idea_score_history (idea_id, battle_id, elo_before, elo_after, result)
        VALUES
          (${winner_id}, ${battle_id}, ${winner.elo_score}, ${newWinnerRating}, 'win'),
          (${loserId}, ${battle_id}, ${loser.elo_score}, ${newLoserRating}, 'loss')
      `;

      return {
        winner: { ...winner, elo_score: newWinnerRating, wins: winner.wins + 1 },
        loser: { ...loser, elo_score: newLoserRating, losses: loser.losses + 1 },
        newWinnerRating,
        newLoserRating,
        prediction: {
          correct: predictionCorrect,
          targetId: predictionTargetId,
          difficulty: predictionDifficulty,
          ranked: predictionRanked,
          eloBefore: voterEloBefore,
          eloAfter: voterEloAfter,
          eloDelta: voterEloAfter - voterEloBefore,
          streak: predictionStreak,
          bestStreak: bestPredictionStreak,
        },
      };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await trackEvent({
      name: "vote_created",
      userId: user.id,
      path: new URL(request.url).pathname,
      metadata: {
        battle_id,
        winner_id,
        prediction_correct: result.prediction.correct,
        prediction_ranked: result.prediction.ranked,
        prediction_delta: result.prediction.eloDelta,
      },
    });

    return NextResponse.json({
      winner: result.winner,
      loser: result.loser,
      newWinnerRating: result.newWinnerRating,
      newLoserRating: result.newLoserRating,
      prediction: result.prediction,
    });
  } catch (error) {
    // Check for unique constraint violation (duplicate vote)
    const message = error instanceof Error ? error.message : "Vote failed";
    if (message.includes("votes_battle_user_unique") || message.includes("duplicate key")) {
      return NextResponse.json({ error: "Already voted on this battle" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to add a reason" }, { status: 401 });
  }

  const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = userResult.rows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limited = await rateLimit(request, {
    name: "vote_reason",
    limit: 30,
    windowSeconds: 3600,
    identity: rateLimitIdentity(request, user.id),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Too many vote reasons. Try again later.");

  const { battle_id, reason } = await request.json();

  if (!battle_id || !reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const trimmed = String(reason).trim().slice(0, 500);
  if (!trimmed) {
    return NextResponse.json({ error: "Reason cannot be empty" }, { status: 400 });
  }
  const spamError = publicTextError(trimmed, { maxUrls: 1 });
  if (spamError) {
    return NextResponse.json({ error: spamError }, { status: 400 });
  }

  try {
    const result = await sql`
      UPDATE votes SET reason = ${trimmed}
      WHERE battle_id = ${battle_id} AND user_id = ${user.id}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    await trackEvent({
      name: "vote_reason_added",
      userId: user.id,
      path: new URL(request.url).pathname,
      metadata: { battle_id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update reason";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
