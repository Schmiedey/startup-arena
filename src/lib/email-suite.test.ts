import { describe, expect, it } from "vitest";
import {
  buildMarketingEmail,
  isEmailSegmentKey,
  unsubscribeTokenForUser,
  verifyUnsubscribeToken,
  type EmailRecipient,
} from "./email-suite";

const recipient: EmailRecipient = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "founder@example.com",
  name: "Wes",
  created_at: "2026-06-06T12:00:00Z",
  plan: "free",
  ideas_count: 0,
  votes_count: 0,
  last_vote_at: null,
};

describe("email suite helpers", () => {
  it("validates email segment keys", () => {
    expect(isEmailSegmentKey("no_idea")).toBe(true);
    expect(isEmailSegmentKey("inactive_battle_7d")).toBe(true);
    expect(isEmailSegmentKey("bad_segment")).toBe(false);
  });

  it("signs and verifies unsubscribe tokens", () => {
    const token = unsubscribeTokenForUser(recipient.id);

    expect(verifyUnsubscribeToken(token)).toBe(recipient.id);
    expect(verifyUnsubscribeToken(`${recipient.id}.bad`)).toBeNull();
  });

  it("builds personalized marketing email content with unsubscribe link", () => {
    const email = buildMarketingEmail({
      recipient,
      subject: "Welcome back, {{name}}",
      body: "Hi {{name}}, vote on a few battles this week.",
      ctaLabel: "Open battles",
      ctaUrl: "/battle",
    });

    expect(email.subject).toBe("Welcome back, Wes");
    expect(email.text).toContain("Hi Wes");
    expect(email.text).toContain("Open battles: https://likelyr.com/battle");
    expect(email.text).toContain("/api/email/unsubscribe?token=");
    expect(email.html).toContain("Unsubscribe");
  });
});
