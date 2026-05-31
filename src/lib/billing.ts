import { sql } from "@vercel/postgres";

export type BillingPlan = "free" | "launch" | "pro";
export type CheckoutPlan = "launch-pass" | "founder-pro-monthly" | "founder-pro-yearly";

export const PLAN_LIMITS: Record<BillingPlan, number | null> = {
  free: 1,
  launch: 5,
  pro: null,
};

export const CHECKOUT_PLANS: Record<
  CheckoutPlan,
  {
    name: string;
    description: string;
    amount: number;
    mode: "payment" | "subscription";
    interval?: "month" | "year";
    entitlement: BillingPlan;
  }
> = {
  "launch-pass": {
    name: "Likelyr Launch Pass",
    description: "Submit up to 5 ideas and unlock share-ready challenge flows.",
    amount: 1900,
    mode: "payment",
    entitlement: "launch",
  },
  "founder-pro-monthly": {
    name: "Likelyr Founder Pro",
    description: "Unlimited ideas, advanced visibility, and ongoing founder tools.",
    amount: 1200,
    mode: "subscription",
    interval: "month",
    entitlement: "pro",
  },
  "founder-pro-yearly": {
    name: "Likelyr Founder Pro Annual",
    description: "Founder Pro billed annually.",
    amount: 9900,
    mode: "subscription",
    interval: "year",
    entitlement: "pro",
  },
};

export interface BillingUser {
  id: string;
  email: string;
  plan: BillingPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  launch_pass_purchased_at: string | null;
}

export function normalizePlan(user: {
  plan?: string | null;
  subscription_status?: string | null;
  launch_pass_purchased_at?: string | null;
}): BillingPlan {
  if (user.plan === "pro" && isActiveSubscription(user.subscription_status)) return "pro";
  if (user.launch_pass_purchased_at || user.plan === "launch") return "launch";
  return "free";
}

export function isActiveSubscription(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export function ideaLimitForPlan(plan: BillingPlan) {
  return PLAN_LIMITS[plan];
}

export async function getBillingUserByEmail(email: string): Promise<BillingUser | null> {
  const result = await sql`
    SELECT id, email, plan, stripe_customer_id, stripe_subscription_id, subscription_status, launch_pass_purchased_at
    FROM users
    WHERE email = ${email}
  `;

  const user = result.rows[0] as BillingUser | undefined;
  if (!user) return null;

  return {
    ...user,
    plan: normalizePlan(user),
  };
}
