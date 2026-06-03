import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasLaunchAccess, normalizePlan } from "@/lib/billing";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";
import { validateLeadPayload } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();
  const currentUserResult = session?.user?.email
    ? await sql`SELECT id, email FROM users WHERE email = ${session.user.email}`
    : null;
  const currentUser = currentUserResult?.rows[0] as { id: string; email: string } | undefined;

  const limited = await rateLimit(request, {
    name: "founder_lead_create",
    limit: 10,
    windowSeconds: 3600,
    identity: rateLimitIdentity(request, currentUser?.id),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Too many lead requests. Try again later.");

  const validation = validateLeadPayload(await request.json().catch(() => null));
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const data = validation.data;
  const founderResult = await sql`
    SELECT
      id,
      plan,
      subscription_status,
      launch_pass_purchased_at,
      COALESCE(profile_show_contact, true) AS profile_show_contact
    FROM users
    WHERE id = ${data.founder_user_id}
  `;
  const founder = founderResult.rows[0] as
    | {
        id: string;
        plan: string | null;
        subscription_status: string | null;
        launch_pass_purchased_at: string | null;
        profile_show_contact: boolean;
      }
    | undefined;

  if (!founder || !hasLaunchAccess(normalizePlan(founder))) {
    return NextResponse.json({ error: "Founder contact is not available" }, { status: 404 });
  }
  if (!founder.profile_show_contact) {
    return NextResponse.json({ error: "Founder contact is disabled" }, { status: 403 });
  }

  if (data.idea_id) {
    const ideaResult = await sql`SELECT id FROM ideas WHERE id = ${data.idea_id} AND user_id = ${founder.id}`;
    if (ideaResult.rows.length === 0) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
  }

  const email = data.email ?? currentUser?.email ?? null;
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO founder_leads (founder_user_id, lead_user_id, idea_id, email, message, source)
    VALUES (${founder.id}, ${currentUser?.id ?? null}, ${data.idea_id ?? null}, ${email}, ${data.message ?? null}, ${data.source ?? "founder_profile"})
    RETURNING id, created_at
  `;

  await trackEvent({
    name: "founder_lead_submitted",
    userId: currentUser?.id,
    path: new URL(request.url).pathname,
    metadata: {
      founder_user_id: founder.id,
      idea_id: data.idea_id ?? null,
      source: data.source ?? "founder_profile",
    },
  });

  return NextResponse.json({ ok: true, lead: result.rows[0] }, { status: 201 });
}
