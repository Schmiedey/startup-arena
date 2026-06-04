import { sql } from "@vercel/postgres";
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
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const limited = await rateLimit(request, {
      name: "billing_portal",
      limit: 12,
      windowSeconds: 600,
      identity: rateLimitIdentity(request, user.id),
    });
    if (!limited.ok) return rateLimitResponse(limited, "Too many billing portal requests. Try again soon.");

    const stripe = getStripe();
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const existingCustomers = await stripe.customers.list({ email: user.email, limit: 5 });
      const activeCustomer = existingCustomers.data.find((c) => !("deleted" in c));

      if (activeCustomer) {
        customerId = activeCustomer.id;
      } else {
        const newCustomer = await stripe.customers.create({
          email: user.email,
          name: session.user?.name || undefined,
          metadata: { userId: user.id },
        });
        customerId = newCustomer.id;
      }

      await sql`
        UPDATE users SET stripe_customer_id = ${customerId}
        WHERE id = ${user.id}
      `;
    }

    const origin = new URL(request.url).origin;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });

    await trackEvent({
      name: "billing_portal_opened",
      userId: user.id,
      path: new URL(request.url).pathname,
      metadata: { plan: user.plan, created_customer: !user.stripe_customer_id },
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    const message = error instanceof Error && error.message === "STRIPE_SECRET_KEY is not configured"
      ? "Stripe billing is not configured yet."
      : "Could not open billing portal. Try again soon.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
