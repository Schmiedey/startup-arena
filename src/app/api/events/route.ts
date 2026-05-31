import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isEventName, trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";
import { sql } from "@vercel/postgres";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  const session = await auth();
  const userResult = session?.user?.email
    ? await sql`SELECT id FROM users WHERE email = ${session.user.email}`
    : null;
  const userId = userResult?.rows[0]?.id as string | undefined;
  const limited = await rateLimit(request, {
    name: "analytics_event",
    limit: 180,
    windowSeconds: 600,
    identity: rateLimitIdentity(request, userId),
  });
  if (!limited.ok) return rateLimitResponse(limited);

  const body = await request.json().catch(() => null);
  if (!isRecord(body) || !isEventName(body.name)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  await trackEvent({
    name: body.name,
    userId,
    clientId: typeof body.clientId === "string" ? body.clientId : null,
    path: typeof body.path === "string" ? body.path : null,
    referrer: typeof body.referrer === "string" ? body.referrer : null,
    metadata: isRecord(body.metadata) ? body.metadata : {},
    forwardToPostHog: false,
  });

  return NextResponse.json({ ok: true });
}
