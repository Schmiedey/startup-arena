import { describe, expect, it } from "vitest";
import {
  checkoutErrorMessage,
  checkoutSessionParams,
  checkoutSessionParamsWithoutCustomer,
  isMissingStripeCustomerError,
} from "./checkout";

const user = {
  id: "user-1",
  email: "founder@example.com",
  stripe_customer_id: "cus_123",
};

describe("checkout helpers", () => {
  it("uses an existing Stripe customer when available", () => {
    const params = checkoutSessionParams("launch-pass", user, "https://likelyr.com");

    expect(params.customer).toBe("cus_123");
    expect(params.customer_email).toBeUndefined();
    expect(params.success_url).toBe("https://likelyr.com/dashboard?checkout=success");
  });

  it("can build retry params without a stale Stripe customer", () => {
    const params = checkoutSessionParamsWithoutCustomer("founder-pro-monthly", user, "https://likelyr.com");

    expect(params.mode).toBe("subscription");
    expect(params.customer).toBeUndefined();
    expect(params.customer_email).toBe("founder@example.com");
    expect(params.subscription_data).toEqual({
      metadata: {
        userId: "user-1",
        plan: "founder-pro-monthly",
        entitlement: "pro",
      },
    });
  });

  it("recognizes Stripe missing-customer errors", () => {
    expect(isMissingStripeCustomerError({
      type: "StripeInvalidRequestError",
      code: "resource_missing",
      param: "customer",
    }, "cus_123")).toBe(true);

    expect(isMissingStripeCustomerError({
      type: "StripeInvalidRequestError",
      code: "resource_missing",
      param: "price",
    }, "cus_123")).toBe(false);
  });

  it("returns a setup message for Stripe configuration errors", () => {
    expect(checkoutErrorMessage(new Error("STRIPE_SECRET_KEY is not configured"))).toBe("Stripe checkout is not configured yet.");
    expect(checkoutErrorMessage({ type: "StripeAuthenticationError" })).toBe("Stripe checkout is not configured yet.");
  });
});
