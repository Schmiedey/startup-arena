import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { sendEmailVerificationEmail } from "@/lib/email";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/seo";
import {
  cleanupExpiredAuthTokens,
  cleanName,
  createAuthToken,
  hashPassword,
  normalizeEmail,
  validateEmail,
  validatePassword,
} from "@/lib/password-auth";

export const runtime = "nodejs";

function genericResponse() {
  return NextResponse.json({
    ok: true,
    message: "If that account can be created, a verification email has been sent.",
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const email = normalizeEmail(payload && typeof payload === "object" ? (payload as { email?: unknown }).email : undefined);
  const password = payload && typeof payload === "object" ? (payload as { password?: unknown }).password : undefined;
  const name = cleanName(payload && typeof payload === "object" ? (payload as { name?: unknown }).name : undefined);

  const limiter = await rateLimit(request, {
    name: "auth-signup",
    limit: 5,
    windowSeconds: 60 * 60,
    identity: email || null,
  });
  if (!limiter.ok) return rateLimitResponse(limiter);

  if (!validateEmail(email) || !validatePassword(password)) {
    return NextResponse.json(
      { error: "Use a valid email and a password with at least 8 characters, including a letter and a number." },
      { status: 400 }
    );
  }

  const existing = await sql`
    SELECT id, password_hash, email_verified_at
    FROM users
    WHERE email = ${email}
  `;
  const existingUser = existing.rows[0] as { id: string; password_hash: string | null; email_verified_at: Date | string | null } | undefined;

  if (existingUser?.email_verified_at) return genericResponse();

  const passwordHash = await hashPassword(password);
  const result = existingUser
    ? await sql`
        UPDATE users
        SET name = COALESCE(${name}, name), password_hash = ${passwordHash}
        WHERE id = ${existingUser.id}
        RETURNING id, email
      `
    : await sql`
        INSERT INTO users (name, email, password_hash)
        VALUES (${name}, ${email}, ${passwordHash})
        RETURNING id, email
      `;

  const user = result.rows[0] as { id: string; email: string };
  const token = await createAuthToken({
    userId: user.id,
    email: user.email,
    type: "email_verification",
    expiresInMinutes: 60,
  });

  await sendEmailVerificationEmail({
    to: user.email,
    url: absoluteUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`),
  });

  if (Math.random() < 0.05) await cleanupExpiredAuthTokens().catch(() => {});
  return genericResponse();
}
