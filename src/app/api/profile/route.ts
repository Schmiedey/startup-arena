import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { publicTextError } from "@/lib/moderation";
import { trackEvent } from "@/lib/analytics";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";
import { getBillingUserByEmail, hasLaunchAccess } from "@/lib/billing";
import { validatePremiumProfilePayload } from "@/lib/validation";

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

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to update profile" }, { status: 401 });
  }

  const user = await getBillingUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!hasLaunchAccess(user.plan)) {
    return NextResponse.json(
      { error: "Paid members can customize founder profiles.", upgradeUrl: "/pricing" },
      { status: 402 }
    );
  }

  const limited = await rateLimit(request, {
    name: "premium_profile_update",
    limit: 20,
    windowSeconds: 3600,
    identity: rateLimitIdentity(request, user.id),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Too many profile updates. Try again later.");

  const validation = validatePremiumProfilePayload(await request.json().catch(() => null));
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const currentResult = await sql`
    SELECT
      profile_headline,
      profile_bio,
      profile_website_url,
      profile_demo_url,
      profile_linkedin_url,
      profile_x_url,
      profile_cta_label,
      profile_cta_url,
      profile_show_contact,
      profile_weekly_digest_opt_in,
      profile_featured_category
    FROM users
    WHERE id = ${user.id}
  `;
  const current = currentResult.rows[0] as {
    profile_headline: string | null;
    profile_bio: string | null;
    profile_website_url: string | null;
    profile_demo_url: string | null;
    profile_linkedin_url: string | null;
    profile_x_url: string | null;
    profile_cta_label: string | null;
    profile_cta_url: string | null;
    profile_show_contact: boolean | null;
    profile_weekly_digest_opt_in: boolean | null;
    profile_featured_category: string | null;
  } | undefined;

  const data = validation.data;
  const merged = {
    profile_headline: data.profile_headline !== undefined ? data.profile_headline : current?.profile_headline ?? null,
    profile_bio: data.profile_bio !== undefined ? data.profile_bio : current?.profile_bio ?? null,
    profile_website_url: data.profile_website_url !== undefined ? data.profile_website_url : current?.profile_website_url ?? null,
    profile_demo_url: data.profile_demo_url !== undefined ? data.profile_demo_url : current?.profile_demo_url ?? null,
    profile_linkedin_url: data.profile_linkedin_url !== undefined ? data.profile_linkedin_url : current?.profile_linkedin_url ?? null,
    profile_x_url: data.profile_x_url !== undefined ? data.profile_x_url : current?.profile_x_url ?? null,
    profile_cta_label: data.profile_cta_label !== undefined ? data.profile_cta_label : current?.profile_cta_label ?? null,
    profile_cta_url: data.profile_cta_url !== undefined ? data.profile_cta_url : current?.profile_cta_url ?? null,
    profile_show_contact: data.profile_show_contact !== undefined ? data.profile_show_contact : current?.profile_show_contact ?? true,
    profile_weekly_digest_opt_in: data.profile_weekly_digest_opt_in !== undefined
      ? data.profile_weekly_digest_opt_in
      : current?.profile_weekly_digest_opt_in ?? true,
    profile_featured_category: data.profile_featured_category !== undefined
      ? data.profile_featured_category
      : current?.profile_featured_category ?? null,
  };

  const updated = await sql`
    UPDATE users SET
      profile_headline = ${merged.profile_headline},
      profile_bio = ${merged.profile_bio},
      profile_website_url = ${merged.profile_website_url},
      profile_demo_url = ${merged.profile_demo_url},
      profile_linkedin_url = ${merged.profile_linkedin_url},
      profile_x_url = ${merged.profile_x_url},
      profile_cta_label = ${merged.profile_cta_label},
      profile_cta_url = ${merged.profile_cta_url},
      profile_show_contact = ${merged.profile_show_contact},
      profile_weekly_digest_opt_in = ${merged.profile_weekly_digest_opt_in},
      profile_featured_category = ${merged.profile_featured_category}
    WHERE id = ${user.id}
    RETURNING
      id,
      name,
      email,
      image,
      profile_headline,
      profile_bio,
      profile_website_url,
      profile_demo_url,
      profile_linkedin_url,
      profile_x_url,
      profile_cta_label,
      profile_cta_url,
      profile_show_contact,
      profile_weekly_digest_opt_in,
      profile_featured_category
  `;

  await trackEvent({
    name: "premium_profile_updated",
    userId: user.id,
    path: new URL(request.url).pathname,
    metadata: {
      plan: user.plan,
      has_cta: Boolean(merged.profile_cta_url),
      featured_category: merged.profile_featured_category,
    },
  });

  return NextResponse.json({ user: updated.rows[0] });
}
