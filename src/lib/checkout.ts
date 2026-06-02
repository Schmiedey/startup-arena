import type Stripe from "stripe";
import { CHECKOUT_PLANS, type CheckoutPlan, type BillingUser } from "@/lib/billing";

type CheckoutUser = Pick<BillingUser, "id" | "email" | "stripe_customer_id">;

export function checkoutSessionParams(plan: CheckoutPlan, user: CheckoutUser, origin: string): Stripe.Checkout.SessionCreateParams {
  const checkoutPlan = CHECKOUT_PLANS[plan];

  return {
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
  };
}

export function checkoutSessionParamsWithoutCustomer(
  plan: CheckoutPlan,
  user: CheckoutUser,
  origin: string
): Stripe.Checkout.SessionCreateParams {
  return checkoutSessionParams(plan, { ...user, stripe_customer_id: null }, origin);
}

export function isMissingStripeCustomerError(error: unknown, stripeCustomerId: string | null | undefined) {
  if (!stripeCustomerId || typeof error !== "object" || error === null) return false;

  const stripeError = error as { code?: unknown; param?: unknown; type?: unknown };
  return stripeError.type === "StripeInvalidRequestError" && stripeError.code === "resource_missing" && stripeError.param === "customer";
}

export function checkoutErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "STRIPE_SECRET_KEY is not configured") {
    return "Stripe checkout is not configured yet.";
  }

  const stripeError = error as { type?: unknown } | null;
  if (stripeError?.type === "StripeAuthenticationError") {
    return "Stripe checkout is not configured yet.";
  }

  return "Could not start checkout. Try again soon.";
}

export function logCheckoutError(error: unknown, metadata: Record<string, unknown>) {
  console.error(JSON.stringify({
    level: "error",
    msg: "checkout_start_failed",
    ...metadata,
    error: error instanceof Error ? error.message : String(error),
  }));
}
