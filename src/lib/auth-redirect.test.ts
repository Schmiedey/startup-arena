import { describe, expect, it } from "vitest";
import { DEFAULT_AUTH_REDIRECT, safeAuthRedirect, signinPathFor } from "@/lib/auth-redirect";

describe("auth redirect helpers", () => {
  it("uses the dashboard as the default auth destination", () => {
    expect(safeAuthRedirect(null)).toBe(DEFAULT_AUTH_REDIRECT);
    expect(safeAuthRedirect("")).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it("keeps relative app paths", () => {
    expect(safeAuthRedirect("/submit")).toBe("/submit");
    expect(safeAuthRedirect("/pricing?checkout=launch-pass")).toBe("/pricing?checkout=launch-pass");
  });

  it("normalizes same-origin absolute URLs to relative paths", () => {
    expect(safeAuthRedirect("https://likelyr.com/dashboard?checkout=success", "https://likelyr.com")).toBe(
      "/dashboard?checkout=success"
    );
  });

  it("rejects protocol-relative and external URLs", () => {
    expect(safeAuthRedirect("//evil.example/dashboard")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(safeAuthRedirect("https://evil.example/dashboard", "https://likelyr.com")).toBe(DEFAULT_AUTH_REDIRECT);
  });

  it("builds a sign-in path with a safe callback URL", () => {
    expect(signinPathFor("/pricing?checkout=founder-pro-monthly", "https://likelyr.com")).toBe(
      "/signin?callbackUrl=%2Fpricing%3Fcheckout%3Dfounder-pro-monthly"
    );
  });
});
