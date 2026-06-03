import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { CHECKOUT_PLANS, getBillingUserByEmail, isActiveSubscription } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

function isDeletedCustomer(customer: Stripe.Customer | Stripe.DeletedCustomer): customer is Stripe.DeletedCustomer {
  return "deleted" in customer && customer.deleted === true;
}

async function findActiveSubscription(stripe: Stripe, user: Awaited<ReturnType<typeof getBillingUserByEmail>>) {
  if (!user) return null;

  if (user.stripe_subscription_id) {
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    if (isActiveSubscription(subscription.status)) return subscription;
  }

  const customerIds = new Set<string>();
  if (user.stripe_customer_id) customerIds.add(user.stripe_customer_id);

  const customers = await stripe.customers.list({ email: user.email, limit: 10 });
  for (const customer of customers.data) {
    if (!isDeletedCustomer(customer)) customerIds.add(customer.id);
  }

  for (const customerId of customerIds) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });
    const active = subscriptions.data.find((subscription) => isActiveSubscription(subscription.status));
    if (active) return active;
  }

  return null;
}

async function findCompletedLaunchSession(stripe: Stripe, user: Awaited<ReturnType<typeof getBillingUserByEmail>>) {
  if (!user) return null;

  const customerIds = new Set<string>();
  if (user.stripe_customer_id) customerIds.add(user.stripe_customer_id);

  const customers = await stripe.customers.list({ email: user.email, limit: 10 });
  for (const customer of customers.data) {
    if (!isDeletedCustomer(customer)) customerIds.add(customer.id);
  }

  const sessionLists = await Promise.all([
    stripe.checkout.sessions.list({
      customer_details: { email: user.email },
      status: "complete",
      limit: 10,
    }),
    ...Array.from(customerIds).map((customer) =>
      stripe.checkout.sessions.list({
        customer,
        status: "complete",
        limit: 10,
      })
    ),
  ]);

  return sessionLists
    .flatMap((sessions) => sessions.data)
    .find((checkoutSession) => {
      const belongsToUser = checkoutSession.metadata?.userId === user.id || checkoutSession.client_reference_id === user.id;
      const isLaunchPass =
        checkoutSession.metadata?.entitlement === "launch" ||
        checkoutSession.metadata?.plan === "launch-pass" ||
        checkoutSession.amount_total === CHECKOUT_PLANS["launch-pass"].amount;

      return belongsToUser && isLaunchPass && checkoutSession.payment_status === "paid";
    }) ?? null;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
  }

  const user = await getBillingUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limited = await rateLimit(request, {
    name: "billing_sync",
    limit: 6,
    windowSeconds: 600,
    identity: rateLimitIdentity(request, user.id),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Too many billing sync attempts. Try again soon.");

  const stripe = getStripe();
  const subscription = await findActiveSubscription(stripe, user);

  if (subscription) {
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    await sql`
      UPDATE users SET
        plan = 'pro',
        stripe_customer_id = ${customerId},
        stripe_subscription_id = ${subscription.id},
        subscription_status = ${subscription.status}
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ plan: "pro", synced: true });
  }

  const launchSession = await findCompletedLaunchSession(stripe, user);
  if (launchSession) {
    const customerId = typeof launchSession.customer === "string" ? launchSession.customer : launchSession.customer?.id ?? null;
    await sql`
      UPDATE users SET
        plan = CASE WHEN plan = 'pro' THEN 'pro' ELSE 'launch' END,
        stripe_customer_id = COALESCE(${customerId}, stripe_customer_id),
        launch_pass_purchased_at = COALESCE(launch_pass_purchased_at, NOW())
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ plan: "launch", synced: true });
  }

  return NextResponse.json({ plan: user.plan, synced: false });
}
