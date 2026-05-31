import { PostHog } from "posthog-node";
import { cleanMetadata, normalizedPath, type TrackEventInput } from "@/lib/analytics-shared";

function projectToken() {
  return process.env.POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || null;
}

function postHogHost() {
  return process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
}

export function isPostHogServerConfigured() {
  return Boolean(projectToken());
}

export async function capturePostHogServerEvent(input: TrackEventInput) {
  const token = projectToken();
  if (!token) return;

  const client = new PostHog(token, {
    host: postHogHost(),
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    client.capture({
      distinctId: input.userId || input.clientId || "anonymous",
      event: input.name,
      properties: cleanMetadata({
        ...input.metadata,
        app: "likelyr",
        source: "server",
        user_id: input.userId ?? null,
        client_id: input.clientId ?? null,
        path: normalizedPath(input.path),
        $current_url: input.path ?? null,
        $referrer: input.referrer ?? null,
      }),
    });
  } finally {
    await client.shutdown();
  }
}
