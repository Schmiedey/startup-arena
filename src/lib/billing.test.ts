import { describe, expect, it } from "vitest";
import { hasLaunchAccess, hasProAccess, ideaLimitForPlan, normalizePlan } from "./billing";

describe("billing entitlements", () => {
  it("normalizes active paid plans", () => {
    expect(normalizePlan({ plan: "pro", subscription_status: "active" })).toBe("pro");
    expect(normalizePlan({ plan: "pro", subscription_status: "trialing" })).toBe("pro");
    expect(normalizePlan({ plan: "pro", subscription_status: "canceled" })).toBe("free");
    expect(normalizePlan({ plan: "free", launch_pass_purchased_at: "2026-01-01T00:00:00Z" })).toBe("launch");
  });

  it("maps submission limits and paid feature gates", () => {
    expect(ideaLimitForPlan("free")).toBe(1);
    expect(ideaLimitForPlan("launch")).toBe(5);
    expect(ideaLimitForPlan("pro")).toBeNull();
    expect(hasLaunchAccess("free")).toBe(false);
    expect(hasLaunchAccess("launch")).toBe(true);
    expect(hasLaunchAccess("pro")).toBe(true);
    expect(hasProAccess("launch")).toBe(false);
    expect(hasProAccess("pro")).toBe(true);
  });
});
