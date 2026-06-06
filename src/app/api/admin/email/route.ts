import { NextResponse } from "next/server";
import { requireAdmin, adminDenied } from "@/lib/admin";
import {
  EMAIL_SEGMENTS,
  ensureEmailSuiteSchema,
  getEmailAutomations,
  getEmailHistory,
  getEmailSegmentCounts,
  isEmailSegmentKey,
  sendManualCampaign,
  updateEmailAutomation,
} from "@/lib/email-suite";
import { isGmailEmailConfigured } from "@/lib/email";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  try {
    await ensureEmailSuiteSchema();
    const [segmentCounts, automations, history] = await Promise.all([
      getEmailSegmentCounts(),
      getEmailAutomations(),
      getEmailHistory(),
    ]);

    return NextResponse.json({
      configured: isGmailEmailConfigured(),
      segments: segmentCounts,
      segmentOptions: EMAIL_SEGMENTS,
      automations,
      ...history,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to load email suite", 500);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  if (!body || typeof body !== "object") return jsonError("Invalid request body");
  const payload = body as Record<string, unknown>;
  const segmentKey = stringValue(payload.segmentKey);
  if (!isEmailSegmentKey(segmentKey)) return jsonError("Invalid email segment");

  try {
    const result = await sendManualCampaign(String(admin.id), {
      segmentKey,
      subject: stringValue(payload.subject),
      body: stringValue(payload.body),
      ctaLabel: stringValue(payload.ctaLabel),
      ctaUrl: stringValue(payload.ctaUrl),
      limit: typeof payload.limit === "number" ? payload.limit : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to send campaign", 500);
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  if (!body || typeof body !== "object") return jsonError("Invalid request body");
  const payload = body as Record<string, unknown>;
  const key = stringValue(payload.key);
  if (!key) return jsonError("Automation key required");

  try {
    await updateEmailAutomation({
      key,
      enabled: typeof payload.enabled === "boolean" ? payload.enabled : undefined,
      subject: typeof payload.subject === "string" ? payload.subject : undefined,
      body: typeof payload.body === "string" ? payload.body : undefined,
      ctaLabel: typeof payload.ctaLabel === "string" ? payload.ctaLabel : undefined,
      ctaUrl: typeof payload.ctaUrl === "string" ? payload.ctaUrl : undefined,
      updatedBy: String(admin.id),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to update automation", 500);
  }
}
