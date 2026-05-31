import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { calculateElo } from "@/lib/elo";
import { checkBanned, bannedResponse } from "@/lib/admin";
import { withTransaction } from "@/lib/db";
import { publicTextError } from "@/lib/moderation";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

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
        SELECT idea_a_id, idea_b_id FROM battles WHERE id = ${battle_id} FOR UPDATE
      `;
      const battle = battleResult.rows[0];
      if (!battle) {
        return { error: "Battle not found", status: 404 as const };
      }

      if (winner_id !== battle.idea_a_id && winner_id !== battle.idea_b_id) {
        return { error: "Invalid winner for this battle", status: 400 as const };
      }

      const loserId = winner_id === battle.idea_a_id ? battle.idea_b_id : battle.idea_a_id;

      const ideaA = await client.sql`SELECT user_id FROM ideas WHERE id = ${battle.idea_a_id}`;
      const ideaB = await client.sql`SELECT user_id FROM ideas WHERE id = ${battle.idea_b_id}`;
      if (ideaA.rows[0]?.user_id === user.id || ideaB.rows[0]?.user_id === user.id) {
        return { error: "You cannot vote on your own idea", status: 403 as const };
      }

      const trimmedReason = typeof reason === "string" ? reason.trim().slice(0, 500) : null;
      if (trimmedReason) {
        const spamError = publicTextError(trimmedReason, { maxUrls: 1 });
        if (spamError) return { error: spamError, status: 400 as const };
      }
      await client.sql`
        INSERT INTO votes (battle_id, user_id, winner_id, reason)
        VALUES (${battle_id}, ${user.id}, ${winner_id}, ${trimmedReason})
      `;

      const winnerResult = await client.sql`SELECT * FROM ideas WHERE id = ${winner_id} FOR UPDATE`;
      const loserResult = await client.sql`SELECT * FROM ideas WHERE id = ${loserId} FOR UPDATE`;
      const winner = winnerResult.rows[0];
      const loser = loserResult.rows[0];

      if (!winner || !loser) {
        return { error: "Idea not found", status: 404 as const };
      }

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

      return {
        winner: { ...winner, elo_score: newWinnerRating, wins: winner.wins + 1 },
        loser: { ...loser, elo_score: newLoserRating, losses: loser.losses + 1 },
        newWinnerRating,
        newLoserRating,
      };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await trackEvent({
      name: "vote_created",
      userId: user.id,
      path: new URL(request.url).pathname,
      metadata: { battle_id, winner_id },
    });

    return NextResponse.json({
      winner: result.winner,
      loser: result.loser,
      newWinnerRating: result.newWinnerRating,
      newLoserRating: result.newLoserRating,
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
