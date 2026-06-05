import type Stripe from "stripe";
import type { BillingUser } from "@/lib/billing";

type PortalCustomer = Pick<Stripe.Customer, "id">;
type PortalSubscription = Pick<Stripe.Subscription, "customer" | "metadata" | "status">;

export type BillingPortalCustomerSource =
  | "stored_subscription"
  | "stored_customer"
  | "email_subscription"
  | "email_customer"
  | "created_customer"
  | "no_customer";

export interface BillingPortalCustomerResolution {
  customerId: string | null;
  source: BillingPortalCustomerSource;
  hasCurrentSubscription: boolean;
}

interface StripePortalClient {
  customers: {
    create(params: Stripe.CustomerCreateParams): Promise<Stripe.Customer>;
    list(params: Stripe.CustomerListParams): Promise<Stripe.ApiList<Stripe.Customer>>;
    retrieve(id: string): Promise<Stripe.Customer | Stripe.DeletedCustomer>;
  };
  subscriptions: {
    list(params: Stripe.SubscriptionListParams): Promise<Stripe.ApiList<Stripe.Subscription>>;
    retrieve(id: string): Promise<Stripe.Subscription>;
  };
}

const PORTAL_CURRENT_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);

function isDeletedCustomer(customer: Stripe.Customer | Stripe.DeletedCustomer): customer is Stripe.DeletedCustomer {
  return "deleted" in customer && customer.deleted === true;
}

function isMissingStripeResourceError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  const stripeError = error as { code?: unknown; type?: unknown };
  return stripeError.type === "StripeInvalidRequestError" && stripeError.code === "resource_missing";
}

export function customerIdFromSubscription(subscription: PortalSubscription) {
  return typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
}

export function isPortalCurrentSubscription(subscription: Pick<Stripe.Subscription, "status">) {
  return PORTAL_CURRENT_SUBSCRIPTION_STATUSES.has(subscription.status);
}

export function chooseCustomerWithCurrentSubscription(
  matches: Array<{ customer: PortalCustomer; subscriptions: PortalSubscription[] }>,
  userId: string
): PortalCustomer | null {
  const userSubscriptionMatch = matches.find(({ subscriptions }) =>
    subscriptions.some((subscription) =>
      isPortalCurrentSubscription(subscription) && subscription.metadata?.userId === userId
    )
  );
  if (userSubscriptionMatch) return userSubscriptionMatch.customer;

  return matches.find(({ subscriptions }) => subscriptions.some(isPortalCurrentSubscription))?.customer ?? null;
}

async function retrieveCustomerOrNull(stripe: StripePortalClient, customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return isDeletedCustomer(customer) ? null : customer;
  } catch (error) {
    if (isMissingStripeResourceError(error)) return null;
    throw error;
  }
}

async function retrieveSubscriptionOrNull(stripe: StripePortalClient, subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    if (isMissingStripeResourceError(error)) return null;
    throw error;
  }
}

async function listCustomerSubscriptions(stripe: StripePortalClient, customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  return subscriptions.data;
}

export async function resolveBillingPortalCustomer(
  stripe: StripePortalClient,
  user: Pick<BillingUser, "id" | "email" | "stripe_customer_id" | "stripe_subscription_id">,
  profileName?: string | null,
  options: { createIfMissing?: boolean } = {}
): Promise<BillingPortalCustomerResolution> {
  let storedSubscriptionCustomerId: string | null = null;

  if (user.stripe_subscription_id) {
    const subscription = await retrieveSubscriptionOrNull(stripe, user.stripe_subscription_id);
    storedSubscriptionCustomerId = subscription ? customerIdFromSubscription(subscription) : null;
    if (subscription && storedSubscriptionCustomerId && isPortalCurrentSubscription(subscription)) {
      return { customerId: storedSubscriptionCustomerId, source: "stored_subscription", hasCurrentSubscription: true };
    }
  }

  const storedCustomer = user.stripe_customer_id
    ? await retrieveCustomerOrNull(stripe, user.stripe_customer_id)
    : null;
  if (storedCustomer) {
    const subscriptions = await listCustomerSubscriptions(stripe, storedCustomer.id);
    if (chooseCustomerWithCurrentSubscription([{ customer: storedCustomer, subscriptions }], user.id)) {
      return { customerId: storedCustomer.id, source: "stored_customer", hasCurrentSubscription: true };
    }
  }

  const existingCustomers = await stripe.customers.list({ email: user.email, limit: 100 });
  const customerMatches = await Promise.all(
    existingCustomers.data.map(async (customer) => ({
      customer,
      subscriptions: await listCustomerSubscriptions(stripe, customer.id),
    }))
  );

  const subscribedCustomer = chooseCustomerWithCurrentSubscription(customerMatches, user.id);
  if (subscribedCustomer) {
    return { customerId: subscribedCustomer.id, source: "email_subscription", hasCurrentSubscription: true };
  }

  if (storedCustomer) {
    return { customerId: storedCustomer.id, source: "stored_customer", hasCurrentSubscription: false };
  }

  if (storedSubscriptionCustomerId) {
    return { customerId: storedSubscriptionCustomerId, source: "stored_subscription", hasCurrentSubscription: false };
  }

  const emailCustomer = existingCustomers.data[0];
  if (emailCustomer) {
    return { customerId: emailCustomer.id, source: "email_customer", hasCurrentSubscription: false };
  }

  if (options.createIfMissing === false) {
    return { customerId: null, source: "no_customer", hasCurrentSubscription: false };
  }

  const newCustomer = await stripe.customers.create({
    email: user.email,
    name: profileName || undefined,
    metadata: { userId: user.id },
  });
  return { customerId: newCustomer.id, source: "created_customer", hasCurrentSubscription: false };
}
