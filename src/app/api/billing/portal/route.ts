import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBillingUserByEmail } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Sign in to manage billing" }, { status: 401 });
    }

    const user = await getBillingUserByEmail(session.user.email);
    if (!user?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
    }

    const limited = await rateLimit(request, {
      name: "billing_portal",
      limit: 12,
      windowSeconds: 600,
      identity: rateLimitIdentity(request, user.id),
    });
    if (!limited.ok) return rateLimitResponse(limited, "Too many billing portal requests. Try again soon.");

    const origin = new URL(request.url).origin;
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${origin}/pricing`,
    });

    await trackEvent({
      name: "billing_portal_opened",
      userId: user.id,
      path: new URL(request.url).pathname,
      metadata: { plan: user.plan },
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    const message = error instanceof Error && error.message === "STRIPE_SECRET_KEY is not configured"
      ? "Stripe billing is not configured yet."
      : "Could not open billing portal. Try again soon.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
