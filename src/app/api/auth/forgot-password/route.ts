import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/seo";
import { cleanupExpiredAuthTokens, createAuthToken, normalizeEmail, validateEmail } from "@/lib/password-auth";

export const runtime = "nodejs";

function genericResponse() {
  return NextResponse.json({
    ok: true,
    message: "If that email has a password account, a reset link has been sent.",
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const email = normalizeEmail(payload && typeof payload === "object" ? (payload as { email?: unknown }).email : undefined);

  const limiter = await rateLimit(request, {
    name: "auth-forgot-password",
    limit: 5,
    windowSeconds: 60 * 60,
    identity: email || null,
  });
  if (!limiter.ok) return rateLimitResponse(limiter);

  if (!validateEmail(email)) return genericResponse();

  const result = await sql`
    SELECT id, email
    FROM users
    WHERE email = ${email}
      AND password_hash IS NOT NULL
      AND email_verified_at IS NOT NULL
  `;
  const user = result.rows[0] as { id: string; email: string } | undefined;
  if (!user) return genericResponse();

  const token = await createAuthToken({
    userId: user.id,
    email: user.email,
    type: "password_reset",
    expiresInMinutes: 30,
  });

  await sendPasswordResetEmail({
    to: user.email,
    url: absoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`),
  });

  if (Math.random() < 0.05) await cleanupExpiredAuthTokens().catch(() => {});
  return genericResponse();
}
