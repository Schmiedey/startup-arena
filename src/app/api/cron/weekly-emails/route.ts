import { NextResponse } from "next/server";
import { runWeeklyEmailAutomations } from "@/lib/email-suite";

export const maxDuration = 60;

function cleanSecret(value: string | undefined) {
  return value?.trim().replace(/(?:\\r|\\n)+$/g, "");
}

export async function GET(request: Request) {
  const cronSecret = cleanSecret(process.env.CRON_SECRET);
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWeeklyEmailAutomations();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Weekly emails failed" },
      { status: 500 }
    );
  }
}
