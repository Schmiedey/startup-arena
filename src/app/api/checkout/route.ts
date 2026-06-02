import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CHECKOUT_PLANS, type CheckoutPlan, clearStripeCustomerId, getBillingUserByEmail } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";
import {
  checkoutErrorMessage,
  checkoutSessionParams,
  checkoutSessionParamsWithoutCustomer,
  isMissingStripeCustomerError,
  logCheckoutError,
} from "@/lib/checkout";

function isCheckoutPlan(value: unknown): value is CheckoutPlan {
  return typeof value === "string" && value in CHECKOUT_PLANS;
}

export async function POST(request: Request) {
  try {
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

    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.create(checkoutSessionParams(plan, user, origin));
    } catch (error) {
      const staleCustomerId = user.stripe_customer_id;
      if (!isMissingStripeCustomerError(error, staleCustomerId) || !staleCustomerId) throw error;

      logCheckoutError(error, {
        userId: user.id,
        plan,
        stripe_customer_id: staleCustomerId,
        recovered: true,
      });
      await clearStripeCustomerId(user.id, staleCustomerId);
      checkoutSession = await stripe.checkout.sessions.create(checkoutSessionParamsWithoutCustomer(plan, user, origin));
    }

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
  } catch (error) {
    logCheckoutError(error, { recovered: false });

    return NextResponse.json({ error: checkoutErrorMessage(error) }, { status: 500 });
  }
}
