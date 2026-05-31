export type AnalyticsMetadata = Record<string, unknown>;

export interface TrackEventInput {
  name: string;
  userId?: string | null;
  clientId?: string | null;
  path?: string | null;
  referrer?: string | null;
  metadata?: AnalyticsMetadata;
  forwardToPostHog?: boolean;
}

export const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;

export function isEventName(value: unknown): value is string {
  return typeof value === "string" && EVENT_NAME_PATTERN.test(value);
}

function cleanString(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 500);
}

export function cleanMetadata(metadata: AnalyticsMetadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) =>
        value === null ||
        value === undefined ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      )
      .slice(0, 32)
      .map(([key, value]) => [key.slice(0, 80), typeof value === "string" ? cleanString(value) : value ?? null])
  );
}

export function normalizedPath(path?: string | null) {
  if (!path) return null;
  return path.slice(0, 300);
}
