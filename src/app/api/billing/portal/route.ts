import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { getBillingUserByEmail } from "@/lib/billing";
import { resolveBillingPortalCustomer } from "@/lib/billing-portal";
import { getStripe } from "@/lib/stripe";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

let cachedConfigId: string | null = null;

function configHasSubscriptionFeatures(config: Stripe.BillingPortal.Configuration): boolean {
  return !!config.features.subscription_cancel?.enabled;
}

async function ensurePortalConfiguration(stripe: Stripe): Promise<string> {
  if (cachedConfigId) return cachedConfigId;

  const configs = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });

  const suitable = configs.data.find(configHasSubscriptionFeatures);
  if (suitable) {
    cachedConfigId = suitable.id;
    return cachedConfigId;
  }

  const config = await stripe.billingPortal.configurations.create({
    features: {
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        cancellation_reason: {
          enabled: true,
          options: ["too_expensive", "unused", "other"],
        },
      },
      payment_method_update: { enabled: true },
      customer_update: {
        enabled: true,
        allowed_updates: ["email", "name"],
      },
      invoice_history: { enabled: true },
    },
    business_profile: {
      headline: "Manage your Likelyr subscription and billing",
    },
  });

  cachedConfigId = config.id;
  return cachedConfigId;
}

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
    const customerResolution = await resolveBillingPortalCustomer(stripe, user, session.user?.name);

    if (customerResolution.customerId !== user.stripe_customer_id) {
      await sql`
        UPDATE users SET stripe_customer_id = ${customerResolution.customerId}
        WHERE id = ${user.id}
      `;
    }

    const origin = new URL(request.url).origin;
    const configuration = await ensurePortalConfiguration(stripe);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerResolution.customerId,
      configuration,
      return_url: `${origin}/dashboard`,
    });

    await trackEvent({
      name: "billing_portal_opened",
      userId: user.id,
      path: new URL(request.url).pathname,
      metadata: { plan: user.plan, customer_source: customerResolution.source },
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    const message = error instanceof Error && error.message === "STRIPE_SECRET_KEY is not configured"
      ? "Stripe billing is not configured yet."
      : "Could not open billing portal. Try again soon.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
