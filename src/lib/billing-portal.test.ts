import { describe, expect, it } from "vitest";
import {
  chooseCustomerWithCurrentSubscription,
  customerIdFromSubscription,
  isPortalCurrentSubscription,
  resolveBillingPortalCustomer,
} from "./billing-portal";

function apiList<T>(data: T[]) {
  return { data, has_more: false, object: "list", url: "" } as const;
}

describe("billing portal helpers", () => {
  it("uses the subscription customer id", () => {
    expect(customerIdFromSubscription({ customer: "cus_subscription", metadata: {}, status: "active" })).toBe("cus_subscription");
    expect(customerIdFromSubscription({
      customer: { id: "cus_expanded" },
      metadata: {},
      status: "active",
    })).toBe("cus_expanded");
  });

  it("treats current and recoverable subscription statuses as portal-relevant", () => {
    expect(isPortalCurrentSubscription({ status: "active" })).toBe(true);
    expect(isPortalCurrentSubscription({ status: "trialing" })).toBe(true);
    expect(isPortalCurrentSubscription({ status: "past_due" })).toBe(true);
    expect(isPortalCurrentSubscription({ status: "canceled" })).toBe(false);
    expect(isPortalCurrentSubscription({ status: "incomplete_expired" })).toBe(false);
  });

  it("prefers the customer whose current subscription belongs to the user", () => {
    const chosen = chooseCustomerWithCurrentSubscription([
      {
        customer: { id: "cus_other" },
        subscriptions: [{ customer: "cus_other", metadata: { userId: "other-user" }, status: "active" }],
      },
      {
        customer: { id: "cus_user" },
        subscriptions: [{ customer: "cus_user", metadata: { userId: "user-1" }, status: "trialing" }],
      },
    ], "user-1");

    expect(chosen?.id).toBe("cus_user");
  });

  it("falls back to any customer with a current subscription and ignores canceled-only customers", () => {
    const chosen = chooseCustomerWithCurrentSubscription([
      {
        customer: { id: "cus_canceled" },
        subscriptions: [{ customer: "cus_canceled", metadata: { userId: "user-1" }, status: "canceled" }],
      },
      {
        customer: { id: "cus_current" },
        subscriptions: [{ customer: "cus_current", metadata: {}, status: "active" }],
      },
    ], "user-1");

    expect(chosen?.id).toBe("cus_current");
  });

  it("does not let a canceled stored subscription hide a current email-matched subscription", async () => {
    const stripe = {
      customers: {
        create: async () => ({ id: "cus_created" }),
        list: async () => apiList([{ id: "cus_current" }]),
        retrieve: async () => ({ id: "cus_stored" }),
      },
      subscriptions: {
        retrieve: async () => ({ customer: "cus_stale", metadata: { userId: "user-1" }, status: "canceled" }),
        list: async ({ customer }: { customer: string }) => apiList(
          customer === "cus_current"
            ? [{ customer: "cus_current", metadata: { userId: "user-1" }, status: "active" }]
            : []
        ),
      },
    };

    const resolved = await resolveBillingPortalCustomer(stripe, {
      id: "user-1",
      email: "founder@example.com",
      stripe_customer_id: null,
      stripe_subscription_id: "sub_stale",
    });

    expect(resolved).toEqual({
      customerId: "cus_current",
      source: "email_subscription",
      hasCurrentSubscription: true,
    });
  });

  it("can avoid creating an empty Stripe customer when no subscription exists", async () => {
    let created = false;
    const stripe = {
      customers: {
        create: async () => {
          created = true;
          return { id: "cus_created" };
        },
        list: async () => apiList([]),
        retrieve: async () => ({ id: "cus_stored" }),
      },
      subscriptions: {
        retrieve: async () => ({ customer: "cus_stale", metadata: { userId: "user-1" }, status: "canceled" }),
        list: async () => apiList([]),
      },
    };

    const resolved = await resolveBillingPortalCustomer(stripe, {
      id: "user-1",
      email: "founder@example.com",
      stripe_customer_id: null,
      stripe_subscription_id: null,
    }, null, { createIfMissing: false });

    expect(created).toBe(false);
    expect(resolved).toEqual({
      customerId: null,
      source: "no_customer",
      hasCurrentSubscription: false,
    });
  });
});
