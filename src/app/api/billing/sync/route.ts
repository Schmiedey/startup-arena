import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { getBillingUserByEmail, isActiveSubscription } from "@/lib/billing";
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

  if (!subscription) {
    return NextResponse.json({ plan: user.plan, synced: false });
  }

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
