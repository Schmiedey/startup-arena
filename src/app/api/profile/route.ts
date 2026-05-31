import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { publicTextError } from "@/lib/moderation";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

const MAX_SIZE = 500 * 1024; // 500KB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to update profile" }, { status: 401 });
  }

  const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  const user = userResult.rows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const limited = await rateLimit(request, {
    name: "profile_update",
    limit: 20,
    windowSeconds: 3600,
    identity: rateLimitIdentity(request, user.id),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Too many profile updates. Try again later.");

  const formData = await request.formData();
  const name = formData.get("name") as string | null;
  const avatarFile = formData.get("avatar") as File | null;

  let imageUrl: string | null = null;

  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > MAX_SIZE) {
      return NextResponse.json({ error: "Avatar must be under 500KB" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(avatarFile.type)) {
      return NextResponse.json({ error: "Avatar must be JPEG, PNG, WebP, or GIF" }, { status: 400 });
    }

    const arrayBuffer = await avatarFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    imageUrl = `data:${avatarFile.type};base64,${base64}`;
  }

  const trimmedName = name?.trim().slice(0, 50) || null;
  if (trimmedName) {
    const spamError = publicTextError(trimmedName, { maxUrls: 0 });
    if (spamError) return NextResponse.json({ error: spamError }, { status: 400 });
  }

  if (trimmedName && imageUrl) {
    await sql`UPDATE users SET name = ${trimmedName}, image = ${imageUrl} WHERE id = ${user.id}`;
  } else if (trimmedName) {
    await sql`UPDATE users SET name = ${trimmedName} WHERE id = ${user.id}`;
  } else if (imageUrl) {
    await sql`UPDATE users SET image = ${imageUrl} WHERE id = ${user.id}`;
  }

  const updated = await sql`SELECT id, name, email, image FROM users WHERE id = ${user.id}`;
  await trackEvent({
    name: "profile_updated",
    userId: user.id,
    path: new URL(request.url).pathname,
    metadata: { changed_name: Boolean(trimmedName), changed_avatar: Boolean(imageUrl) },
  });
  return NextResponse.json({ user: updated.rows[0] });
}
