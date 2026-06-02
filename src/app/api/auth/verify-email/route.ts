import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { hashAuthToken } from "@/lib/password-auth";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) return NextResponse.redirect(absoluteUrl("/signin?verified=0"));

  const tokenHash = hashAuthToken(token);
  const result = await sql`
    WITH token AS (
      DELETE FROM user_auth_tokens
      WHERE token_hash = ${tokenHash}
        AND type = 'email_verification'
        AND expires_at > NOW()
      RETURNING user_id
    )
    UPDATE users
    SET email_verified_at = COALESCE(email_verified_at, NOW())
    FROM token
    WHERE users.id = token.user_id
    RETURNING users.id
  `;

  return NextResponse.redirect(absoluteUrl(result.rows.length ? "/signin?verified=1" : "/signin?verified=0"));
}
