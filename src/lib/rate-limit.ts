import crypto from "crypto";
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

interface RateLimitOptions {
  name: string;
  limit: number;
  windowSeconds: number;
  identity?: string | null;
}

interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter: number;
}

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip") || "unknown";
}

function hashIdentifier(value: string) {
  const salt = process.env.AUTH_SECRET ?? "likelyr-rate-limit";
  return crypto.createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export function rateLimitIdentity(request: Request, userId?: string | null) {
  if (userId) return `user:${userId}`;
  return `ip:${hashIdentifier(clientIp(request))}`;
}

export async function rateLimit(request: Request, options: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const resetAt = new Date(windowStart.getTime() + windowMs);
  const identity = options.identity ?? rateLimitIdentity(request);
  const rateKey = `${options.name}:${identity}`;

  const result = await sql`
    INSERT INTO api_rate_limits (rate_key, window_start, count)
    VALUES (${rateKey}, ${windowStart.toISOString()}, 1)
    ON CONFLICT (rate_key, window_start)
    DO UPDATE SET count = api_rate_limits.count + 1
    RETURNING count
  `;

  if (Math.random() < 0.01) {
    await sql`DELETE FROM api_rate_limits WHERE created_at < NOW() - INTERVAL '2 days'`.catch(() => {});
  }

  const count = Number(result.rows[0]?.count ?? 1);
  const remaining = Math.max(0, options.limit - count);

  return {
    ok: count <= options.limit,
    limit: options.limit,
    remaining,
    resetAt,
    retryAfter: Math.max(1, Math.ceil((resetAt.getTime() - now) / 1000)),
  };
}

export function rateLimitResponse(result: RateLimitResult, message = "Too many requests. Try again soon.") {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": result.resetAt.toISOString(),
      },
    }
  );
}
