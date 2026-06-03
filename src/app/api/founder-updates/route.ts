import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBillingUserByEmail, hasProAccess } from "@/lib/billing";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";
import { validateFounderUpdatePayload } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to post founder updates" }, { status: 401 });
  }

  const user = await getBillingUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!hasProAccess(user.plan)) {
    return NextResponse.json(
      { error: "Founder updates are a Founder Pro feature.", upgradeUrl: "/pricing" },
      { status: 402 }
    );
  }

  const limited = await rateLimit(request, {
    name: "founder_update_create",
    limit: 12,
    windowSeconds: 3600,
    identity: rateLimitIdentity(request, user.id),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Too many founder updates. Try again later.");

  const validation = validateFounderUpdatePayload(await request.json().catch(() => null));
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { title, body, idea_id } = validation.data;
  if (idea_id) {
    const ideaResult = await sql`SELECT id FROM ideas WHERE id = ${idea_id} AND user_id = ${user.id}`;
    if (ideaResult.rows.length === 0) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
  }

  const result = await sql`
    INSERT INTO founder_updates (user_id, idea_id, title, body)
    VALUES (${user.id}, ${idea_id ?? null}, ${title}, ${body})
    RETURNING id, user_id, idea_id, title, body, created_at
  `;

  await trackEvent({
    name: "founder_update_posted",
    userId: user.id,
    path: new URL(request.url).pathname,
    metadata: { idea_id: idea_id ?? null },
  });

  return NextResponse.json(result.rows[0], { status: 201 });
}
