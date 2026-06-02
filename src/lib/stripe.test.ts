import { describe, expect, it } from "vitest";
import { cleanStripeSecret } from "./stripe";

describe("stripe helpers", () => {
  it("removes copied literal newline suffixes from Stripe secrets", () => {
    expect(cleanStripeSecret("sk_test_123\\n")).toBe("sk_test_123");
    expect(cleanStripeSecret("whsec_123\\r\\n")).toBe("whsec_123");
  });

  it("trims normal whitespace from Stripe secrets", () => {
    expect(cleanStripeSecret("  sk_test_123\n")).toBe("sk_test_123");
  });
});
