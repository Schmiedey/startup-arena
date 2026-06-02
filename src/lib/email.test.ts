import { describe, expect, it, vi } from "vitest";
import { base64UrlEncode, buildRawEmail } from "./email";

vi.stubEnv("GMAIL_SENDER_EMAIL", "hello@likelyr.com");

describe("email helpers", () => {
  it("builds base64url content without padding", () => {
    expect(base64UrlEncode("hello?")).toBe("aGVsbG8_");
  });

  it("builds a raw multipart Gmail message", () => {
    const raw = buildRawEmail({
      to: "founder@example.com",
      subject: "Sign in",
      text: "Use this link",
      html: "<p>Use this link</p>",
    });

    expect(raw).toContain("From: Likelyr <hello@likelyr.com>");
    expect(raw).toContain("To: founder@example.com");
    expect(raw).toContain("Subject: Sign in");
    expect(raw).toContain("multipart/alternative");
  });

  it("builds transactional password emails", () => {
    const raw = buildRawEmail({
      to: "founder@example.com",
      subject: "Reset your Likelyr password",
      text: "Use this reset link.",
    });

    expect(raw).toContain("Subject: Reset your Likelyr password");
    expect(raw).toContain("Use this reset link.");
  });
});
