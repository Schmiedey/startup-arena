import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to flag comments" }, { status: 401 });
  }

  const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = userResult.rows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limited = await rateLimit(request, {
    name: "comment_flag",
    limit: 40,
    windowSeconds: 3600,
    identity: rateLimitIdentity(request, user.id),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Too many flags. Try again later.");

  const { commentId } = await request.json();
  if (!commentId) {
    return NextResponse.json({ error: "commentId required" }, { status: 400 });
  }

  try {
    const result = await sql`
      UPDATE comments SET flag_count = COALESCE(flag_count, 0) + 1
      WHERE id = ${commentId}
      RETURNING *
    `;
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    await trackEvent({
      name: "comment_flagged",
      userId: user.id,
      path: new URL(request.url).pathname,
      metadata: { comment_id: commentId },
    });
    return NextResponse.json({ ok: true, flag_count: result.rows[0].flag_count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Flag failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
