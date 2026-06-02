import crypto from "crypto";
import { promisify } from "util";
import { sql } from "@vercel/postgres";

export type AuthTokenType = "email_verification" | "password_reset";

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

export function cleanName(value: unknown) {
  if (typeof value !== "string") return "Anonymous";
  return value.replace(/\s+/g, " ").trim().slice(0, 80) || "Anonymous";
}

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function validatePassword(password: unknown): password is string {
  if (typeof password !== "string") return false;
  if (password.length < 8 || password.length > 128) return false;
  return /[A-Za-z]/.test(password) && /\d/.test(password);
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, passwordHash: string | null | undefined) {
  if (!passwordHash) return false;
  const [algorithm, salt, expectedHash] = passwordHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHash) return false;

  const expected = Buffer.from(expectedHash, "base64url");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

export function newRawToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashAuthToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createAuthToken({
  userId,
  email,
  type,
  expiresInMinutes,
}: {
  userId: string;
  email: string;
  type: AuthTokenType;
  expiresInMinutes: number;
}) {
  const token = newRawToken();
  const tokenHash = hashAuthToken(token);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

  await sql`
    WITH deleted AS (
      DELETE FROM user_auth_tokens
      WHERE user_id = ${userId} AND type = ${type}
    )
    INSERT INTO user_auth_tokens (user_id, email, token_hash, type, expires_at)
    VALUES (${userId}, ${email}, ${tokenHash}, ${type}, ${expiresAt})
  `;

  return token;
}

export async function cleanupExpiredAuthTokens() {
  await sql`
    DELETE FROM user_auth_tokens
    WHERE expires_at < NOW() - INTERVAL '1 day'
  `;
}
