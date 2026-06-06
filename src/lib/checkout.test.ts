import { describe, expect, it } from "vitest";
import {
  blockedCheckoutMessage,
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
    expect(params.customer_creation).toBeUndefined();
    expect(params.success_url).toBe("https://likelyr.com/dashboard?checkout=success");
  });

  it("creates a Stripe customer for one-time launch pass payments", () => {
    const params = checkoutSessionParams("launch-pass", { ...user, stripe_customer_id: null }, "https://likelyr.com");

    expect(params.mode).toBe("payment");
    expect(params.customer).toBeUndefined();
    expect(params.customer_email).toBe("founder@example.com");
    expect(params.customer_creation).toBe("always");
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

  it("blocks duplicate Launch Pass checkout for existing paid access", () => {
    expect(blockedCheckoutMessage("launch-pass", {
      plan: "launch",
      launch_pass_purchased_at: "2026-06-05T17:35:12Z",
    })).toBe("Launch Pass is already purchased on this account.");

    expect(blockedCheckoutMessage("launch-pass", {
      plan: "pro",
      launch_pass_purchased_at: null,
    })).toBe("Launch Pass is already purchased on this account.");

    expect(blockedCheckoutMessage("founder-pro-monthly", {
      plan: "launch",
      launch_pass_purchased_at: "2026-06-05T17:35:12Z",
    })).toBeNull();
  });

  it("blocks duplicate Founder Pro checkout for active Pro users", () => {
    expect(blockedCheckoutMessage("founder-pro-monthly", {
      plan: "pro",
      launch_pass_purchased_at: null,
    })).toBe("You are already subscribed to Founder Pro.");

    expect(blockedCheckoutMessage("founder-pro-yearly", {
      plan: "pro",
      launch_pass_purchased_at: "2026-06-05T17:35:12Z",
    })).toBe("You are already subscribed to Founder Pro.");

    expect(blockedCheckoutMessage("founder-pro-yearly", {
      plan: "launch",
      launch_pass_purchased_at: "2026-06-05T17:35:12Z",
    })).toBeNull();
  });
});
