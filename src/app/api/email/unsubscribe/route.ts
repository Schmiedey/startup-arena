import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { ensureEmailSuiteSchema, verifyUnsubscribeToken } from "@/lib/email-suite";

function htmlResponse(title: string, message: string, status = 200) {
  return new NextResponse(
    [
      "<!doctype html>",
      "<html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
      `<title>${title}</title>`,
      "</head>",
      "<body style=\"margin:0;background:#050505;color:#f5f5f5;font-family:Arial,sans-serif\">",
      "<main style=\"max-width:560px;margin:0 auto;padding:72px 24px\">",
      "<p style=\"margin:0 0 12px;color:#dc3c1e;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase\">Likelyr</p>",
      `<h1 style=\"margin:0 0 12px;font-size:28px\">${title}</h1>`,
      `<p style=\"margin:0;color:#a3a3a3;line-height:1.6\">${message}</p>`,
      "</main>",
      "</body></html>",
    ].join(""),
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

export async function GET(request: Request) {
  await ensureEmailSuiteSchema();
  const token = new URL(request.url).searchParams.get("token");
  const userId = verifyUnsubscribeToken(token);
  if (!userId) return htmlResponse("Invalid link", "This unsubscribe link is invalid or expired.", 400);

  await sql`
    UPDATE users
    SET
      email_marketing_enabled = false,
      email_weekly_enabled = false,
      email_product_enabled = false,
      email_unsubscribed_at = COALESCE(email_unsubscribed_at, NOW())
    WHERE id = ${userId}
  `;

  return htmlResponse("Unsubscribed", "You will no longer receive Likelyr marketing or weekly emails.");
}
