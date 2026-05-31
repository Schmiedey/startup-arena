import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkBanned, bannedResponse } from "@/lib/admin";
import { publicTextError } from "@/lib/moderation";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });
  }

  const banCheck = await checkBanned();
  if (banCheck?.banned) return bannedResponse();

  const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = userResult.rows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limited = await rateLimit(request, {
    name: "comment_create",
    limit: 20,
    windowSeconds: 3600,
    identity: rateLimitIdentity(request, user.id),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Too many comments. Slow down and try again later.");

  const { idea_id, body } = await request.json();

  if (!idea_id || !body || typeof body !== "string") {
    return NextResponse.json({ error: "idea_id and body are required" }, { status: 400 });
  }

  const trimmedBody = body.trim();
  if (trimmedBody.length === 0) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }
  if (trimmedBody.length > 1000) {
    return NextResponse.json({ error: "Comment must be under 1000 characters" }, { status: 400 });
  }
  const spamError = publicTextError(trimmedBody, { maxUrls: 1 });
  if (spamError) {
    return NextResponse.json({ error: spamError }, { status: 400 });
  }

  try {
    const result = await sql`
      INSERT INTO comments (idea_id, user_id, body)
      VALUES (${idea_id}, ${user.id}, ${trimmedBody})
      RETURNING *
    `;
    const comment = result.rows[0];
    await trackEvent({
      name: "comment_created",
      userId: user.id,
      path: new URL(request.url).pathname,
      metadata: { idea_id },
    });

    const userByName = await sql`SELECT name, image FROM users WHERE id = ${user.id}`;
    return NextResponse.json({
      ...comment,
      user_name: userByName.rows[0]?.name,
      user_image: userByName.rows[0]?.image,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Insert failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idea_id = searchParams.get("idea_id");

  if (!idea_id) {
    return NextResponse.json({ error: "idea_id required" }, { status: 400 });
  }

  try {
    const result = await sql`
      SELECT c.*, u.name as user_name, u.image as user_image
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.idea_id = ${idea_id}
      ORDER BY c.created_at DESC
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Query failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
