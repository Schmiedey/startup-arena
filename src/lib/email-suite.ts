import { createHmac, timingSafeEqual } from "crypto";
import { sql } from "@vercel/postgres";
import { isGmailEmailConfigured, sendEmail } from "@/lib/email";
import { absoluteUrl, ideaPath } from "@/lib/seo";

export type EmailSegmentKey =
  | "all_users"
  | "no_idea"
  | "inactive_battle_7d"
  | "free_users"
  | "launch_users"
  | "pro_users"
  | "paid_founders"
  | "active_founders";

export interface EmailSegment {
  key: EmailSegmentKey;
  name: string;
  description: string;
}

export interface EmailAutomationDefault {
  key: string;
  name: string;
  segment_key: EmailSegmentKey;
  subject: string;
  body: string;
  cta_label: string;
  cta_url: string;
}

export interface EmailRecipient {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  plan: "free" | "launch" | "pro";
  ideas_count: number;
  votes_count: number;
  last_vote_at: string | null;
}

export interface EmailAutomationRow extends EmailAutomationDefault {
  enabled: boolean;
  frequency: "weekly";
  last_run_at: string | null;
  updated_at: string;
}

export interface SendEmailInput {
  segmentKey: EmailSegmentKey;
  subject: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  limit?: number;
}

interface SendAutomationInput {
  automation: EmailAutomationRow;
  limit?: number;
}

interface SendResult {
  attempted: number;
  sent: number;
  failed: number;
}

export const EMAIL_SEGMENTS: EmailSegment[] = [
  {
    key: "all_users",
    name: "All opted-in users",
    description: "Every real, non-admin user who has not unsubscribed.",
  },
  {
    key: "no_idea",
    name: "Signed up, no idea",
    description: "Users who created an account but have not submitted a project.",
  },
  {
    key: "inactive_battle_7d",
    name: "No battle in 7 days",
    description: "Users whose last vote is older than a week, including users with no votes.",
  },
  {
    key: "free_users",
    name: "Free users",
    description: "Users on the free plan.",
  },
  {
    key: "launch_users",
    name: "Launch Pass users",
    description: "Users with Launch Pass access and no active Pro subscription.",
  },
  {
    key: "pro_users",
    name: "Founder Pro users",
    description: "Users with active Founder Pro access.",
  },
  {
    key: "paid_founders",
    name: "Paid founders",
    description: "Launch Pass and Founder Pro users.",
  },
  {
    key: "active_founders",
    name: "Founders with ideas",
    description: "Users who have submitted at least one project.",
  },
];

export const EMAIL_AUTOMATION_DEFAULTS: EmailAutomationDefault[] = [
  {
    key: "weekly_arena_digest",
    name: "Weekly arena digest",
    segment_key: "all_users",
    subject: "This week's Likelyr momentum",
    body: "Here are the ideas moving fastest this week. Vote on a few battles and see which founders are gaining signal.",
    cta_label: "Open the arena",
    cta_url: "/battle",
  },
  {
    key: "weekly_no_idea_nudge",
    name: "No-project nudge",
    segment_key: "no_idea",
    subject: "Put your first idea into the arena",
    body: "You signed up, but your first idea is not live yet. Add one project and start collecting votes from real comparisons.",
    cta_label: "Submit an idea",
    cta_url: "/submit",
  },
  {
    key: "weekly_inactive_battle_nudge",
    name: "Battle reactivation",
    segment_key: "inactive_battle_7d",
    subject: "New startup battles are waiting",
    body: "A fresh batch of ideas needs votes. Jump into a few matchups and keep your predictor score moving.",
    cta_label: "Vote on battles",
    cta_url: "/battle",
  },
  {
    key: "weekly_founder_growth",
    name: "Founder growth brief",
    segment_key: "active_founders",
    subject: "Your weekly founder signal check",
    body: "Check your ideas, read the newest feedback, and share a challenge link if you need more signal this week.",
    cta_label: "Open dashboard",
    cta_url: "/dashboard",
  },
];

const SEGMENT_KEYS = new Set(EMAIL_SEGMENTS.map((segment) => segment.key));
const MAX_MANUAL_SEND = 100;
const MAX_AUTOMATION_SEND = 60;
let schemaReady = false;

function cleanSecret(value: string | undefined) {
  return value?.trim().replace(/(?:\\r|\\n)+$/g, "");
}

function emailSecret() {
  return (
    cleanSecret(process.env.EMAIL_UNSUBSCRIBE_SECRET)
    || cleanSecret(process.env.AUTH_SECRET)
    || cleanSecret(process.env.NEXTAUTH_SECRET)
    || "likelyr-dev-email-secret"
  );
}

function htmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function normalizeLimit(value: number | undefined, max: number) {
  if (!Number.isFinite(value)) return max;
  return Math.max(1, Math.min(max, Math.floor(value ?? max)));
}

function normalizeText(value: string, maxLength: number) {
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function validateSegmentKey(value: string): asserts value is EmailSegmentKey {
  if (!SEGMENT_KEYS.has(value as EmailSegmentKey)) {
    throw new Error("Invalid email segment");
  }
}

export function isEmailSegmentKey(value: string): value is EmailSegmentKey {
  return SEGMENT_KEYS.has(value as EmailSegmentKey);
}

function personalized(value: string, recipient: EmailRecipient) {
  return value
    .replaceAll("{{name}}", recipient.name?.trim() || "there")
    .replaceAll("{{plan}}", recipient.plan);
}

function absolutize(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return null;
  return absoluteUrl(pathOrUrl);
}

export function unsubscribeTokenForUser(userId: string) {
  const signature = createHmac("sha256", emailSecret()).update(userId).digest("base64url");
  return `${userId}.${signature}`;
}

export function verifyUnsubscribeToken(token: string | null | undefined) {
  if (!token) return null;
  const [userId, signature] = token.split(".");
  if (!userId || !signature) return null;

  const expected = createHmac("sha256", emailSecret()).update(userId).digest("base64url");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return null;
  return timingSafeEqual(providedBuffer, expectedBuffer) ? userId : null;
}

export async function ensureEmailSuiteSchema() {
  if (schemaReady) return;

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_marketing_enabled BOOLEAN DEFAULT TRUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_weekly_enabled BOOLEAN DEFAULT TRUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_product_enabled BOOLEAN DEFAULT TRUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_unsubscribed_at TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ`;

  await sql`
    CREATE TABLE IF NOT EXISTS email_automations (
      key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      segment_key TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly')),
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      cta_label TEXT,
      cta_url TEXT,
      last_run_at TIMESTAMPTZ,
      updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      segment_key TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      cta_label TEXT,
      cta_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
      recipient_count INTEGER NOT NULL DEFAULT 0,
      sent_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      sent_at TIMESTAMPTZ
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS email_deliveries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
      automation_key TEXT REFERENCES email_automations(key) ON DELETE SET NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
      error TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      sent_at TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_email_deliveries_user_sent_at ON email_deliveries(user_id, sent_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_email_deliveries_automation_sent_at ON email_deliveries(automation_key, sent_at DESC)`;

  await seedEmailAutomations();
  schemaReady = true;
}

async function seedEmailAutomations() {
  for (const automation of EMAIL_AUTOMATION_DEFAULTS) {
    await sql`
      INSERT INTO email_automations (key, name, segment_key, subject, body, cta_label, cta_url)
      VALUES (
        ${automation.key},
        ${automation.name},
        ${automation.segment_key},
        ${automation.subject},
        ${automation.body},
        ${automation.cta_label},
        ${automation.cta_url}
      )
      ON CONFLICT (key) DO UPDATE SET
        name = EXCLUDED.name,
        segment_key = EXCLUDED.segment_key,
        updated_at = email_automations.updated_at
    `;
  }
}

function segmentCondition(segmentKey: EmailSegmentKey) {
  switch (segmentKey) {
    case "all_users":
      return "TRUE";
    case "no_idea":
      return "ideas_count = 0";
    case "inactive_battle_7d":
      return "(last_vote_at IS NULL OR last_vote_at < NOW() - INTERVAL '7 days')";
    case "free_users":
      return "plan = 'free'";
    case "launch_users":
      return "plan = 'launch'";
    case "pro_users":
      return "plan = 'pro'";
    case "paid_founders":
      return "plan <> 'free'";
    case "active_founders":
      return "ideas_count > 0";
  }
}

function recipientBaseQuery(condition: string, extraWhere = "") {
  return `
    WITH normalized AS (
      SELECT
        u.id,
        u.email,
        u.name,
        u.created_at,
        CASE
          WHEN u.plan = 'pro' AND u.subscription_status IN ('active', 'trialing') THEN 'pro'
          WHEN u.launch_pass_purchased_at IS NOT NULL OR u.plan = 'launch' THEN 'launch'
          ELSE 'free'
        END AS plan,
        COUNT(DISTINCT i.id)::int AS ideas_count,
        COUNT(DISTINCT v.id)::int AS votes_count,
        MAX(v.created_at) AS last_vote_at
      FROM users u
      LEFT JOIN ideas i ON i.user_id = u.id
      LEFT JOIN votes v ON v.user_id = u.id
      WHERE
        u.email IS NOT NULL
        AND COALESCE(u.is_bot, false) = false
        AND COALESCE(u.is_admin, false) = false
        AND COALESCE(u.banned, false) = false
        AND COALESCE(u.email_marketing_enabled, true) = true
        AND u.email_unsubscribed_at IS NULL
        ${extraWhere}
      GROUP BY u.id
    )
    SELECT *
    FROM normalized
    WHERE ${condition}
  `;
}

export async function getEmailSegmentCounts() {
  await ensureEmailSuiteSchema();

  const counts = await Promise.all(EMAIL_SEGMENTS.map(async (segment) => {
    const result = await sql.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM (${recipientBaseQuery(segmentCondition(segment.key))}) recipients`,
      []
    );
    return { ...segment, count: Number(result.rows[0]?.count ?? 0) };
  }));

  return counts;
}

export async function getSegmentRecipients(segmentKey: EmailSegmentKey, limit = MAX_MANUAL_SEND, automationKey?: string) {
  await ensureEmailSuiteSchema();
  validateSegmentKey(segmentKey);
  const cappedLimit = normalizeLimit(limit, automationKey ? MAX_AUTOMATION_SEND : MAX_MANUAL_SEND);
  const extraWhere = automationKey ? "AND COALESCE(u.email_weekly_enabled, true) = true" : "";
  const recentlySentFilter = automationKey
    ? `AND NOT EXISTS (
        SELECT 1
        FROM email_deliveries d
        WHERE d.user_id = recipients.id
          AND d.automation_key = $2
          AND d.status = 'sent'
          AND d.sent_at >= NOW() - INTERVAL '6 days'
      )`
    : "";
  const query = `
    SELECT *
    FROM (${recipientBaseQuery(segmentCondition(segmentKey), extraWhere)}) recipients
    WHERE TRUE
      ${recentlySentFilter}
    ORDER BY created_at DESC
    LIMIT $1
  `;
  const values = automationKey ? [cappedLimit, automationKey] : [cappedLimit];
  const result = await sql.query<EmailRecipient>(query, values);
  return result.rows.map((row) => ({
    ...row,
    ideas_count: Number(row.ideas_count ?? 0),
    votes_count: Number(row.votes_count ?? 0),
  }));
}

export async function getEmailAutomations() {
  await ensureEmailSuiteSchema();
  const result = await sql<EmailAutomationRow>`
    SELECT key, name, segment_key, enabled, frequency, subject, body, cta_label, cta_url, last_run_at, updated_at
    FROM email_automations
    ORDER BY
      CASE key
        WHEN 'weekly_arena_digest' THEN 1
        WHEN 'weekly_no_idea_nudge' THEN 2
        WHEN 'weekly_inactive_battle_nudge' THEN 3
        WHEN 'weekly_founder_growth' THEN 4
        ELSE 99
      END,
      name ASC
  `;
  return result.rows;
}

export async function getEmailHistory() {
  await ensureEmailSuiteSchema();
  const [campaigns, deliveries] = await Promise.all([
    sql`
      SELECT id, segment_key, subject, status, recipient_count, sent_count, failed_count, created_at, sent_at, error
      FROM email_campaigns
      ORDER BY created_at DESC
      LIMIT 20
    `,
    sql`
      SELECT status, COUNT(*)::int AS count
      FROM email_deliveries
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY status
    `,
  ]);

  return { campaigns: campaigns.rows, deliveryStats: deliveries.rows };
}

export async function updateEmailAutomation(input: {
  key: string;
  enabled?: boolean;
  subject?: string;
  body?: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  updatedBy: string;
}) {
  await ensureEmailSuiteSchema();
  const existing = await sql`SELECT key FROM email_automations WHERE key = ${input.key}`;
  if (!existing.rows.length) throw new Error("Automation not found");

  const subject = input.subject === undefined ? undefined : normalizeText(input.subject, 120);
  const body = input.body === undefined ? undefined : normalizeText(input.body, 2000);
  if (subject !== undefined && subject.length < 3) throw new Error("Subject is too short");
  if (body !== undefined && body.length < 10) throw new Error("Body is too short");

  const current = (await sql<EmailAutomationRow>`
    SELECT key, name, segment_key, enabled, frequency, subject, body, cta_label, cta_url, last_run_at, updated_at
    FROM email_automations
    WHERE key = ${input.key}
  `).rows[0];

  await sql`
    UPDATE email_automations
    SET
      enabled = ${input.enabled ?? current.enabled},
      subject = ${subject ?? current.subject},
      body = ${body ?? current.body},
      cta_label = ${input.ctaLabel === undefined ? current.cta_label : normalizeText(input.ctaLabel ?? "", 60) || null},
      cta_url = ${input.ctaUrl === undefined ? current.cta_url : normalizeText(input.ctaUrl ?? "", 300) || null},
      updated_by = ${input.updatedBy},
      updated_at = NOW()
    WHERE key = ${input.key}
  `;
}

export function buildMarketingEmail({
  recipient,
  subject,
  body,
  ctaLabel,
  ctaUrl,
  digestItems = [],
}: {
  recipient: EmailRecipient;
  subject: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  digestItems?: Array<{ name: string; pitch: string; category: string; url: string; plan: string }>;
}) {
  const resolvedSubject = personalized(subject, recipient);
  const resolvedBody = personalized(body, recipient);
  const resolvedCtaUrl = absolutize(ctaUrl);
  const unsubscribeUrl = absoluteUrl(`/api/email/unsubscribe?token=${encodeURIComponent(unsubscribeTokenForUser(recipient.id))}`);
  const digestText = digestItems.length
    ? [
        "",
        "Featured this week:",
        ...digestItems.map((item) => `- ${item.name} (${item.category}): ${item.pitch} ${item.url}`),
      ].join("\n")
    : "";
  const text = [
    resolvedBody,
    digestText,
    resolvedCtaUrl && ctaLabel ? ["", `${ctaLabel}: ${resolvedCtaUrl}`].join("\n") : "",
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].filter(Boolean).join("\n");
  const digestHtml = digestItems.length
    ? [
        "<div style=\"margin-top:24px\">",
        "<p style=\"margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280\">Featured this week</p>",
        ...digestItems.map((item) => [
          "<div style=\"border-top:1px solid #e5e7eb;padding:12px 0\">",
          `<p style=\"margin:0;font-size:15px;font-weight:700;color:#111827\"><a href=\"${htmlEscape(item.url)}\" style=\"color:#111827;text-decoration:none\">${htmlEscape(item.name)}</a></p>`,
          `<p style=\"margin:4px 0 0;color:#6b7280;font-size:13px\">${htmlEscape(item.category)} · ${htmlEscape(item.plan)}</p>`,
          `<p style=\"margin:6px 0 0;color:#374151;font-size:14px;line-height:1.45\">${htmlEscape(item.pitch)}</p>`,
          "</div>",
        ].join("")),
        "</div>",
      ].join("")
    : "";
  const html = [
    "<div style=\"margin:0;background:#f9fafb;padding:28px 0;font-family:Arial,sans-serif;color:#111827\">",
    "<div style=\"margin:0 auto;max-width:620px;background:#ffffff;border:1px solid #e5e7eb;padding:28px\">",
    "<p style=\"margin:0 0 18px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#dc3c1e\">Likelyr</p>",
    `<h1 style=\"margin:0 0 14px;font-size:22px;line-height:1.2;color:#111827\">${htmlEscape(resolvedSubject)}</h1>`,
    `<p style=\"white-space:pre-line;margin:0;color:#374151;font-size:15px;line-height:1.6\">${htmlEscape(resolvedBody)}</p>`,
    digestHtml,
    resolvedCtaUrl && ctaLabel
      ? `<p style=\"margin:24px 0 0\"><a href=\"${htmlEscape(resolvedCtaUrl)}\" style=\"display:inline-block;background:#dc3c1e;color:#ffffff;padding:11px 15px;text-decoration:none;font-weight:800\">${htmlEscape(ctaLabel)}</a></p>`
      : "",
    "<p style=\"margin:28px 0 0;color:#9ca3af;font-size:12px;line-height:1.5\">",
    `You are receiving this because you signed up for Likelyr. <a href=\"${htmlEscape(unsubscribeUrl)}\" style=\"color:#6b7280\">Unsubscribe</a>.`,
    "</p>",
    "</div>",
    "</div>",
  ].join("");

  return { subject: resolvedSubject, text, html };
}

async function weeklyDigestItems() {
  const result = await sql<{
    id: string;
    name: string;
    pitch: string;
    category: string;
    plan: string;
  }>`
    WITH founders AS (
      SELECT
        u.id,
        CASE
          WHEN u.plan = 'pro' AND u.subscription_status IN ('active', 'trialing') THEN 'pro'
          WHEN u.launch_pass_purchased_at IS NOT NULL OR u.plan = 'launch' THEN 'launch'
          ELSE 'free'
        END AS plan
      FROM users u
      WHERE COALESCE(u.is_bot, false) = false AND COALESCE(u.is_admin, false) = false
    )
    SELECT i.id, i.name, i.pitch, i.category, f.plan
    FROM ideas i
    JOIN founders f ON f.id = i.user_id
    WHERE COALESCE(i.status, 'approved') = 'approved'
    ORDER BY
      CASE f.plan WHEN 'pro' THEN 0 WHEN 'launch' THEN 1 ELSE 2 END,
      i.elo_score DESC,
      i.created_at DESC
    LIMIT 5
  `;

  return result.rows.map((idea) => ({
    name: idea.name,
    pitch: idea.pitch,
    category: idea.category,
    plan: idea.plan === "pro" ? "Founder Pro" : idea.plan === "launch" ? "Launch Pass" : "Free",
    url: absoluteUrl(ideaPath({ id: idea.id, name: idea.name })),
  }));
}

async function sendToRecipient({
  recipient,
  subject,
  body,
  ctaLabel,
  ctaUrl,
  campaignId,
  automationKey,
  digestItems,
}: {
  recipient: EmailRecipient;
  subject: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  campaignId?: string | null;
  automationKey?: string | null;
  digestItems?: Awaited<ReturnType<typeof weeklyDigestItems>>;
}) {
  const content = buildMarketingEmail({ recipient, subject, body, ctaLabel, ctaUrl, digestItems });
  try {
    await sendEmail({
      to: recipient.email,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    await sql`
      INSERT INTO email_deliveries (campaign_id, automation_key, user_id, email, subject, status, sent_at)
      VALUES (${campaignId ?? null}, ${automationKey ?? null}, ${recipient.id}, ${recipient.email}, ${content.subject}, 'sent', NOW())
    `;
    await sql`UPDATE users SET last_email_sent_at = NOW() WHERE id = ${recipient.id}`;
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await sql`
      INSERT INTO email_deliveries (campaign_id, automation_key, user_id, email, subject, status, error)
      VALUES (${campaignId ?? null}, ${automationKey ?? null}, ${recipient.id}, ${recipient.email}, ${content.subject}, 'failed', ${message})
    `;
    return { ok: false };
  }
}

export async function sendManualCampaign(createdBy: string, input: SendEmailInput): Promise<SendResult & { campaignId: string }> {
  await ensureEmailSuiteSchema();
  if (!isGmailEmailConfigured()) throw new Error("Gmail email is not configured");
  validateSegmentKey(input.segmentKey);

  const subject = normalizeText(input.subject, 120);
  const body = normalizeText(input.body, 2000);
  const ctaLabel = normalizeText(input.ctaLabel ?? "", 60) || null;
  const ctaUrl = normalizeText(input.ctaUrl ?? "", 300) || null;
  if (subject.length < 3) throw new Error("Subject is too short");
  if (body.length < 10) throw new Error("Message is too short");

  const campaign = await sql<{ id: string }>`
    INSERT INTO email_campaigns (created_by, segment_key, subject, body, cta_label, cta_url, status)
    VALUES (${createdBy}, ${input.segmentKey}, ${subject}, ${body}, ${ctaLabel}, ${ctaUrl}, 'sending')
    RETURNING id
  `;
  const campaignId = campaign.rows[0].id;
  const recipients = await getSegmentRecipients(input.segmentKey, normalizeLimit(input.limit, MAX_MANUAL_SEND));
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendToRecipient({
      recipient,
      subject,
      body,
      ctaLabel,
      ctaUrl,
      campaignId,
    });
    if (result.ok) sent += 1;
    else failed += 1;
  }

  await sql`
    UPDATE email_campaigns
    SET
      status = ${failed > 0 && sent === 0 ? "failed" : "sent"},
      recipient_count = ${recipients.length},
      sent_count = ${sent},
      failed_count = ${failed},
      sent_at = NOW()
    WHERE id = ${campaignId}
  `;

  return { campaignId, attempted: recipients.length, sent, failed };
}

export async function sendAutomation(input: SendAutomationInput): Promise<SendResult & { key: string }> {
  await ensureEmailSuiteSchema();
  if (!isGmailEmailConfigured()) throw new Error("Gmail email is not configured");
  const recipients = await getSegmentRecipients(input.automation.segment_key, normalizeLimit(input.limit, MAX_AUTOMATION_SEND), input.automation.key);
  const digestItems = input.automation.key === "weekly_arena_digest" ? await weeklyDigestItems() : [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendToRecipient({
      recipient,
      subject: input.automation.subject,
      body: input.automation.body,
      ctaLabel: input.automation.cta_label,
      ctaUrl: input.automation.cta_url,
      automationKey: input.automation.key,
      digestItems,
    });
    if (result.ok) sent += 1;
    else failed += 1;
  }

  await sql`
    UPDATE email_automations
    SET last_run_at = NOW(), updated_at = updated_at
    WHERE key = ${input.automation.key}
  `;

  return { key: input.automation.key, attempted: recipients.length, sent, failed };
}

export async function runWeeklyEmailAutomations() {
  await ensureEmailSuiteSchema();
  const automations = (await getEmailAutomations()).filter((automation) => automation.enabled);
  const results = [];

  for (const automation of automations) {
    results.push(await sendAutomation({ automation }));
  }

  return {
    configured: isGmailEmailConfigured(),
    automations: results,
  };
}
