import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { hashAuthToken, hashPassword, validatePassword } from "@/lib/password-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const token = payload && typeof payload === "object" && typeof (payload as { token?: unknown }).token === "string"
    ? (payload as { token: string }).token
    : "";
  const password = payload && typeof payload === "object" ? (payload as { password?: unknown }).password : undefined;

  if (!token || !validatePassword(password)) {
    return NextResponse.json(
      { error: "Use a valid reset link and a password with at least 8 characters, including a letter and a number." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  const tokenHash = hashAuthToken(token);
  const result = await sql`
    WITH token AS (
      DELETE FROM user_auth_tokens
      WHERE token_hash = ${tokenHash}
        AND type = 'password_reset'
        AND expires_at > NOW()
      RETURNING user_id
    )
    UPDATE users
    SET password_hash = ${passwordHash}
    FROM token
    WHERE users.id = token.user_id
      AND users.email_verified_at IS NOT NULL
    RETURNING users.id
  `;

  if (!result.rows.length) {
    return NextResponse.json({ error: "That reset link is invalid or expired." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Password reset. You can sign in now." });
}
