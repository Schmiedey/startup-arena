import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkBanned, bannedResponse } from "@/lib/admin";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const battleId = searchParams.get("id");
  const challengeIdeaId = searchParams.get("challenge");
  const category = searchParams.get("category");

  if (battleId) {
    try {
      const battleResult = await sql`
        SELECT b.id as battle_id, b.idea_a_id, b.idea_b_id
        FROM battles b
        WHERE b.id = ${battleId}
      `;
      if (battleResult.rows.length === 0) {
        return NextResponse.json({ error: "Battle not found" }, { status: 404 });
      }
      const battle = battleResult.rows[0];
      const ideaAResult = await sql`SELECT i.*, u.name as user_name, u.image as user_image FROM ideas i LEFT JOIN users u ON i.user_id = u.id WHERE i.id = ${battle.idea_a_id}`;
      const ideaBResult = await sql`SELECT i.*, u.name as user_name, u.image as user_image FROM ideas i LEFT JOIN users u ON i.user_id = u.id WHERE i.id = ${battle.idea_b_id}`;
      return NextResponse.json({
        idea_a: ideaAResult.rows[0],
        idea_b: ideaBResult.rows[0],
        battle_id: battle.battle_id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Battle fetch failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const session = await auth();
  let user: { id: string } | null = null;

  if (session?.user?.email) {
    const banCheck = await checkBanned();
    if (banCheck?.banned) return bannedResponse();

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    user = userResult.rows[0] as { id: string } | undefined ?? null;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  }

  const limited = await rateLimit(request, {
    name: "battle_load",
    limit: 150,
    windowSeconds: 600,
    identity: rateLimitIdentity(request, user?.id),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Too many battle requests. Try again soon.");

  try {
    if (challengeIdeaId) {
      const ideaResult = await sql`
        SELECT i.*, u.name as user_name, u.image as user_image
        FROM ideas i LEFT JOIN users u ON i.user_id = u.id
        WHERE i.id = ${challengeIdeaId}
      `;
      const ideaA = ideaResult.rows[0];
      if (!ideaA) {
        return NextResponse.json({ error: "Challenge idea not found" }, { status: 404 });
      }

      const opponentResult = user
        ? await sql`
            SELECT i.*, u.name as user_name, u.image as user_image
            FROM ideas i LEFT JOIN users u ON i.user_id = u.id
            WHERE i.id <> ${challengeIdeaId}
              AND i.user_id IS DISTINCT FROM ${user.id}
            ORDER BY
              CASE WHEN i.category = ${ideaA.category} THEN 0 ELSE 1 END,
              ABS(i.elo_score - ${ideaA.elo_score}),
              RANDOM()
            LIMIT 1
          `
        : await sql`
            SELECT i.*, u.name as user_name, u.image as user_image
            FROM ideas i LEFT JOIN users u ON i.user_id = u.id
            WHERE i.id <> ${challengeIdeaId}
            ORDER BY
              CASE WHEN i.category = ${ideaA.category} THEN 0 ELSE 1 END,
              ABS(i.elo_score - ${ideaA.elo_score}),
              RANDOM()
            LIMIT 1
          `;

      const ideaB = opponentResult.rows[0];
      if (!ideaB) {
        return NextResponse.json({ error: "Not enough ideas to challenge" }, { status: 400 });
      }

      const battleResult = await sql`
        INSERT INTO battles (idea_a_id, idea_b_id)
        VALUES (${ideaA.id}, ${ideaB.id})
        RETURNING id
      `;
      await trackEvent({
        name: "battle_created",
        userId: user?.id,
        path: new URL(request.url).pathname,
        metadata: { mode: "challenge", category: ideaA.category },
      });

      return NextResponse.json({
        idea_a: ideaA,
        idea_b: ideaB,
        battle_id: battleResult.rows[0].id,
        mode: "challenge",
      });
    }

    if (user) {
      // Find an existing battle the user hasn't voted on.
      const existingBattle = category
        ? await sql`
            SELECT b.id as battle_id, b.idea_a_id, b.idea_b_id
            FROM battles b
            JOIN ideas ia ON ia.id = b.idea_a_id
            JOIN ideas ib ON ib.id = b.idea_b_id
            WHERE NOT EXISTS (
              SELECT 1 FROM votes v WHERE v.battle_id = b.id AND v.user_id = ${user.id}
            )
            AND NOT EXISTS (
              SELECT 1 FROM ideas own
              WHERE own.user_id = ${user.id}
                AND (own.id = b.idea_a_id OR own.id = b.idea_b_id)
            )
            AND ia.category = ${category}
            AND ib.category = ${category}
            ORDER BY b.created_at DESC
            LIMIT 1
          `
        : await sql`
            SELECT b.id as battle_id, b.idea_a_id, b.idea_b_id
            FROM battles b
            WHERE NOT EXISTS (
              SELECT 1 FROM votes v WHERE v.battle_id = b.id AND v.user_id = ${user.id}
            )
            AND NOT EXISTS (
              SELECT 1 FROM ideas own
              WHERE own.user_id = ${user.id}
                AND (own.id = b.idea_a_id OR own.id = b.idea_b_id)
            )
            AND b.idea_a_id IS NOT NULL AND b.idea_b_id IS NOT NULL
            ORDER BY b.created_at DESC
            LIMIT 1
          `;

      if (existingBattle.rows.length > 0) {
        const battle = existingBattle.rows[0];
        const ideaAResult = await sql`SELECT i.*, u.name as user_name, u.image as user_image FROM ideas i LEFT JOIN users u ON i.user_id = u.id WHERE i.id = ${battle.idea_a_id}`;
        const ideaBResult = await sql`SELECT i.*, u.name as user_name, u.image as user_image FROM ideas i LEFT JOIN users u ON i.user_id = u.id WHERE i.id = ${battle.idea_b_id}`;

        return NextResponse.json({
          idea_a: ideaAResult.rows[0],
          idea_b: ideaBResult.rows[0],
          battle_id: battle.battle_id,
        });
      }
    }

    // No unvoted battle found, or anonymous visitor. Create a fresh matchup.
    const ideasResult = user
      ? await sql`
          SELECT * FROM ideas
          WHERE user_id IS DISTINCT FROM ${user.id}
            AND (${category}::text IS NULL OR category = ${category})
          ORDER BY elo_score DESC
        `
      : await sql`
          SELECT * FROM ideas
          WHERE (${category}::text IS NULL OR category = ${category})
          ORDER BY elo_score DESC
        `;
    const ideas = ideasResult.rows;

    if (ideas.length < 2) {
      return NextResponse.json(
        { error: "Not enough ideas to battle" },
        { status: 400 }
      );
    }

    const shuffled = [...ideas].sort(() => Math.random() - 0.5);
    const ideaA = shuffled[0];

    const eloRange = 200;
    const candidates = shuffled.filter(
      (i: Record<string, unknown>) =>
        (i as { id: string; elo_score: number }).id !== ideaA.id && Math.abs((i as { id: string; elo_score: number }).elo_score - ideaA.elo_score) <= eloRange
    );

    const pool = candidates.length > 0 ? candidates : shuffled.filter((i: Record<string, unknown>) => (i as { id: string }).id !== ideaA.id);
    const ideaB = pool[Math.floor(Math.random() * pool.length)];

    const battleResult = await sql`
      INSERT INTO battles (idea_a_id, idea_b_id)
      VALUES (${ideaA.id}, ${ideaB.id})
      RETURNING *
    `;
    await trackEvent({
      name: "battle_created",
      userId: user?.id,
      path: new URL(request.url).pathname,
      metadata: { mode: "standard", category: category ?? "all" },
    });

    return NextResponse.json({
      idea_a: ideaA,
      idea_b: ideaB,
      battle_id: battleResult.rows[0].id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Battle failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
