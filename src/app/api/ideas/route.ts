import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkBanned, bannedResponse } from "@/lib/admin";
import { deleteIdeaCascade } from "@/lib/db";
import { validateIdeaPayload, validateIdeaUpdatePayload } from "@/lib/validation";
import { getBillingUserByEmail, ideaLimitForPlan } from "@/lib/billing";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to submit ideas" }, { status: 401 });
  }

  const banCheck = await checkBanned();
  if (banCheck?.banned) return bannedResponse();

  const user = await getBillingUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limited = await rateLimit(request, {
    name: "idea_create",
    limit: 8,
    windowSeconds: 3600,
    identity: rateLimitIdentity(request, user.id),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Too many idea submissions. Try again later.");

  const limit = ideaLimitForPlan(user.plan);
  if (limit !== null) {
    const ideasResult = await sql`SELECT COUNT(*) as count FROM ideas WHERE user_id = ${user.id}`;
    const ideaCount = Number(ideasResult.rows[0].count);
    if (ideaCount >= limit) {
      return NextResponse.json(
        {
          error: user.plan === "free"
            ? "Free accounts can submit 1 idea. Upgrade to Launch Pass or Founder Pro to submit more."
            : "Launch Pass includes up to 5 ideas. Upgrade to Founder Pro for unlimited ideas.",
          upgradeUrl: "/pricing",
          limit,
          plan: user.plan,
        },
        { status: 402 }
      );
    }
  }

  const validation = validateIdeaPayload(await request.json());
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const body = validation.data;

  try {
    const result = await sql`
      INSERT INTO ideas (user_id, name, pitch, target_customer, problem, revenue_model, category, stage)
      VALUES (${user.id}, ${body.name}, ${body.pitch}, ${body.target_customer}, ${body.problem}, ${body.revenue_model}, ${body.category}, ${body.stage})
      RETURNING *
    `;
    await trackEvent({
      name: "idea_submitted",
      userId: user.id,
      path: new URL(request.url).pathname,
      metadata: { category: body.category, stage: body.stage, plan: user.plan },
    });
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Insert failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const category = searchParams.get("category");
  const userId = searchParams.get("userId");
  const sort = searchParams.get("sort");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Number(searchParams.get("limit")) || 50);
  const offset = (page - 1) * limit;

  try {
    if (id) {
      const result = await sql`
        SELECT i.*, u.name as user_name, u.image as user_image
        FROM ideas i LEFT JOIN users u ON i.user_id = u.id
        WHERE i.id = ${id}
      `;
      return NextResponse.json(result.rows);
    }

    if (userId) {
      const result = await sql`
        SELECT i.*, u.name as user_name, u.image as user_image
        FROM ideas i LEFT JOIN users u ON i.user_id = u.id
        WHERE i.user_id = ${userId}
        ORDER BY i.elo_score DESC
      `;
      return NextResponse.json(result.rows);
    }

    if (sort === "divisive") {
      const result = category
        ? await sql`
            SELECT i.*, u.name as user_name, u.image as user_image,
              COUNT(DISTINCT c.id)::int as comment_count,
              COUNT(DISTINCT v.id) FILTER (WHERE v.reason IS NOT NULL)::int as reason_count,
              (
                LEAST(i.wins, i.losses) * 4
                + COUNT(DISTINCT c.id)
                + COUNT(DISTINCT v.id) FILTER (WHERE v.reason IS NOT NULL) * 2
                + GREATEST((i.wins + i.losses) - ABS(i.wins - i.losses), 0)
              )::int as controversy_score
            FROM ideas i
            LEFT JOIN users u ON i.user_id = u.id
            LEFT JOIN comments c ON c.idea_id = i.id
            LEFT JOIN votes v ON v.winner_id = i.id
            WHERE i.category = ${category}
            GROUP BY i.id, u.name, u.image
            ORDER BY controversy_score DESC, (i.wins + i.losses) DESC, i.elo_score DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : await sql`
            SELECT i.*, u.name as user_name, u.image as user_image,
              COUNT(DISTINCT c.id)::int as comment_count,
              COUNT(DISTINCT v.id) FILTER (WHERE v.reason IS NOT NULL)::int as reason_count,
              (
                LEAST(i.wins, i.losses) * 4
                + COUNT(DISTINCT c.id)
                + COUNT(DISTINCT v.id) FILTER (WHERE v.reason IS NOT NULL) * 2
                + GREATEST((i.wins + i.losses) - ABS(i.wins - i.losses), 0)
              )::int as controversy_score
            FROM ideas i
            LEFT JOIN users u ON i.user_id = u.id
            LEFT JOIN comments c ON c.idea_id = i.id
            LEFT JOIN votes v ON v.winner_id = i.id
            GROUP BY i.id, u.name, u.image
            ORDER BY controversy_score DESC, (i.wins + i.losses) DESC, i.elo_score DESC
            LIMIT ${limit} OFFSET ${offset}
          `;
      return NextResponse.json(result.rows);
    }

    const result = category
      ? await sql`
          SELECT i.*, u.name as user_name, u.image as user_image
          FROM ideas i LEFT JOIN users u ON i.user_id = u.id
          WHERE i.category = ${category}
          ORDER BY i.elo_score DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : await sql`
          SELECT i.*, u.name as user_name, u.image as user_image
          FROM ideas i LEFT JOIN users u ON i.user_id = u.id
          ORDER BY i.elo_score DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
    return NextResponse.json(result.rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Query failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to edit ideas" }, { status: 401 });
  }

  const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = userResult.rows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const validation = validateIdeaUpdatePayload(await request.json());
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { id, name, pitch, target_customer, problem, revenue_model, category, stage } = validation.data;

  // Verify ownership
  const existing = await sql`SELECT user_id FROM ideas WHERE id = ${id}`;
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }
  if (existing.rows[0].user_id !== user.id) {
    // Check if admin
    const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${user.id}`;
    if (!adminCheck.rows[0]?.is_admin) {
      return NextResponse.json({ error: "Not authorized to edit this idea" }, { status: 403 });
    }
  }

  try {
    const result = await sql`
      UPDATE ideas SET
        name = COALESCE(${name}, name),
        pitch = COALESCE(${pitch}, pitch),
        target_customer = COALESCE(${target_customer}, target_customer),
        problem = COALESCE(${problem}, problem),
        revenue_model = COALESCE(${revenue_model}, revenue_model),
        category = COALESCE(${category}, category),
        stage = COALESCE(${stage}, stage)
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to delete ideas" }, { status: 401 });
  }

  const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = userResult.rows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const ideaId = searchParams.get("ideaId");
  if (!ideaId) {
    return NextResponse.json({ error: "ideaId required" }, { status: 400 });
  }

  // Verify ownership
  const existing = await sql`SELECT user_id FROM ideas WHERE id = ${ideaId}`;
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }
  if (existing.rows[0].user_id !== user.id) {
    const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${user.id}`;
    if (!adminCheck.rows[0]?.is_admin) {
      return NextResponse.json({ error: "Not authorized to delete this idea" }, { status: 403 });
    }
  }

  try {
    await deleteIdeaCascade(ideaId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
