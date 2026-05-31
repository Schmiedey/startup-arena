import { sql } from "@vercel/postgres";
import { capturePostHogServerEvent } from "@/lib/posthog-server";
import {
  cleanMetadata,
  isEventName,
  normalizedPath,
  type TrackEventInput,
} from "@/lib/analytics-shared";

export { isEventName };

export async function trackEvent(input: TrackEventInput) {
  if (!isEventName(input.name)) return;

  try {
    await sql`
      INSERT INTO analytics_events (name, user_id, client_id, path, referrer, metadata)
      VALUES (
        ${input.name},
        ${input.userId ?? null},
        ${input.clientId?.slice(0, 128) ?? null},
        ${normalizedPath(input.path)},
        ${input.referrer?.slice(0, 300) ?? null},
        ${JSON.stringify(cleanMetadata(input.metadata))}::jsonb
      )
    `;
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      msg: "analytics_event_failed",
      event: input.name,
      error: error instanceof Error ? error.message : String(error),
    }));
  }

  if (input.forwardToPostHog === false) return;

  try {
    await capturePostHogServerEvent(input);
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      msg: "posthog_event_failed",
      event: input.name,
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}
