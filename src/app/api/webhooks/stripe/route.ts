import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { trackEvent } from "@/lib/analytics";

async function applySubscriptionEntitlement(subscription: Stripe.Subscription, fallbackUserId?: string | null) {
  const userId = subscription.metadata.userId ?? fallbackUserId;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  if (!userId) {
    await sql`
      UPDATE users SET
        stripe_customer_id = COALESCE(stripe_customer_id, ${customerId}),
        stripe_subscription_id = ${subscription.id},
        subscription_status = ${subscription.status},
        plan = CASE
          WHEN ${subscription.status} IN ('active', 'trialing') THEN 'pro'
          WHEN launch_pass_purchased_at IS NOT NULL THEN 'launch'
          ELSE 'free'
        END
      WHERE stripe_subscription_id = ${subscription.id} OR stripe_customer_id = ${customerId}
    `;
    return;
  }

  await sql`
    UPDATE users SET
      plan = CASE
        WHEN ${subscription.status} IN ('active', 'trialing') THEN 'pro'
        WHEN launch_pass_purchased_at IS NOT NULL THEN 'launch'
        ELSE 'free'
      END,
      stripe_customer_id = ${customerId},
      stripe_subscription_id = ${subscription.id},
      subscription_status = ${subscription.status}
    WHERE id = ${userId}
  `;
}

async function revokeSubscriptionEntitlement(subscription: Stripe.Subscription) {
  await sql`
    UPDATE users SET
      subscription_status = ${subscription.status},
      plan = CASE WHEN launch_pass_purchased_at IS NOT NULL THEN 'launch' ELSE 'free' END
    WHERE stripe_subscription_id = ${subscription.id}
  `;
}

export async function POST(request: Request) {
  let webhookSecret: string;
  try {
    webhookSecret = getStripeWebhookSecret();
  } catch {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      const userId = checkoutSession.metadata?.userId ?? checkoutSession.client_reference_id;
      const entitlement = checkoutSession.metadata?.entitlement;
      const customerId = typeof checkoutSession.customer === "string" ? checkoutSession.customer : checkoutSession.customer?.id ?? null;

      if (!userId) break;

      if (entitlement === "launch") {
        await sql`
          UPDATE users SET
            plan = CASE WHEN plan = 'pro' THEN 'pro' ELSE 'launch' END,
            stripe_customer_id = COALESCE(${customerId}, stripe_customer_id),
            launch_pass_purchased_at = COALESCE(launch_pass_purchased_at, NOW())
          WHERE id = ${userId}
        `;
      }

      if (entitlement === "pro" && typeof checkoutSession.subscription === "string") {
        const subscription = await getStripe().subscriptions.retrieve(checkoutSession.subscription);
        await applySubscriptionEntitlement(subscription, userId);
      }
      await trackEvent({
        name: "checkout_completed",
        userId,
        path: "/api/webhooks/stripe",
        metadata: {
          entitlement,
          mode: checkoutSession.mode,
          amount_total: checkoutSession.amount_total,
          stripe_session_id: checkoutSession.id,
        },
      });
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await applySubscriptionEntitlement(subscription);
      await trackEvent({
        name: "subscription_updated",
        userId: subscription.metadata.userId,
        path: "/api/webhooks/stripe",
        metadata: { status: subscription.status, stripe_subscription_id: subscription.id },
      });
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await revokeSubscriptionEntitlement(subscription);
      await trackEvent({
        name: "subscription_deleted",
        userId: subscription.metadata.userId,
        path: "/api/webhooks/stripe",
        metadata: { status: subscription.status, stripe_subscription_id: subscription.id },
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
