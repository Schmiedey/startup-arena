import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CHECKOUT_PLANS, type CheckoutPlan, getBillingUserByEmail } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

function isCheckoutPlan(value: unknown): value is CheckoutPlan {
  return typeof value === "string" && value in CHECKOUT_PLANS;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const { plan } = await request.json().catch(() => ({ plan: null }));
  if (!isCheckoutPlan(plan)) {
    return NextResponse.json({ error: "Invalid checkout plan" }, { status: 400 });
  }

  const user = await getBillingUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limited = await rateLimit(request, {
    name: "checkout_start",
    limit: 12,
    windowSeconds: 600,
    identity: rateLimitIdentity(request, user.id),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Too many checkout attempts. Try again soon.");

  const checkoutPlan = CHECKOUT_PLANS[plan];
  const origin = new URL(request.url).origin;
  const stripe = getStripe();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: checkoutPlan.mode,
    customer: user.stripe_customer_id ?? undefined,
    customer_email: user.stripe_customer_id ? undefined : user.email,
    client_reference_id: user.id,
    allow_promotion_codes: true,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: checkoutPlan.amount,
          product_data: {
            name: checkoutPlan.name,
            description: checkoutPlan.description,
          },
          recurring: checkoutPlan.interval ? { interval: checkoutPlan.interval } : undefined,
        },
      },
    ],
    metadata: {
      userId: user.id,
      plan,
      entitlement: checkoutPlan.entitlement,
    },
    subscription_data: checkoutPlan.mode === "subscription"
      ? {
          metadata: {
            userId: user.id,
            plan,
            entitlement: checkoutPlan.entitlement,
          },
        }
      : undefined,
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  });

  await trackEvent({
    name: "checkout_started",
    userId: user.id,
    path: new URL(request.url).pathname,
    metadata: {
      plan,
      mode: checkoutPlan.mode,
      amount: checkoutPlan.amount,
      stripe_session_id: checkoutSession.id,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
