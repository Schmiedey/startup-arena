import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function cleanStripeSecret(value: string | undefined) {
  return value?.trim().replace(/(?:\\r|\\n)+$/g, "");
}

export function getStripe() {
  const secretKey = cleanStripeSecret(process.env.STRIPE_SECRET_KEY);
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripeClient ??= new Stripe(secretKey, {
    typescript: true,
  });
  return stripeClient;
}

export function getStripeWebhookSecret() {
  const webhookSecret = cleanStripeSecret(process.env.STRIPE_WEBHOOK_SECRET);
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return webhookSecret;
}
