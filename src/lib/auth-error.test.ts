import { describe, expect, it } from "vitest";
import { authErrorMessage } from "@/lib/auth-error";

describe("auth error messages", () => {
  it("does not show a message without an auth error", () => {
    expect(authErrorMessage(null)).toBeNull();
    expect(authErrorMessage("")).toBeNull();
  });

  it("explains missing csrf errors as retryable sign-in expiry", () => {
    expect(authErrorMessage("MissingCSRF")).toBe("Your sign-in session expired. Please try again.");
  });

  it("falls back for unknown auth errors", () => {
    expect(authErrorMessage("UnexpectedProviderError")).toBe("Could not sign in. Please try again.");
  });
});
