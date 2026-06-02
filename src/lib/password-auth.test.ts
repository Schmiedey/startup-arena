import { describe, expect, it } from "vitest";
import { hashAuthToken, hashPassword, normalizeEmail, validatePassword, verifyPassword } from "./password-auth";

describe("password auth helpers", () => {
  it("normalizes email addresses", () => {
    expect(normalizeEmail("  Wess04023@GMAIL.COM ")).toBe("wess04023@gmail.com");
    expect(normalizeEmail(null)).toBe("");
  });

  it("validates minimum password strength", () => {
    expect(validatePassword("short1")).toBe(false);
    expect(validatePassword("password")).toBe(false);
    expect(validatePassword("12345678")).toBe(false);
    expect(validatePassword("Password1")).toBe(true);
  });

  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("Password1");
    expect(hash).toMatch(/^scrypt\$/);
    expect(await verifyPassword("Password1", hash)).toBe(true);
    expect(await verifyPassword("Password2", hash)).toBe(false);
    expect(await verifyPassword("Password1", null)).toBe(false);
  });

  it("hashes auth tokens without retaining raw token text", () => {
    const token = "secret-token";
    const tokenHash = hashAuthToken(token);
    expect(tokenHash).toHaveLength(64);
    expect(tokenHash).not.toContain(token);
  });
});
