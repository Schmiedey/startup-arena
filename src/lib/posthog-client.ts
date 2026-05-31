"use client";

import posthog from "posthog-js";
import type { Properties } from "posthog-js";
import { cleanMetadata } from "@/lib/analytics-shared";

let initialized = false;

function projectToken() {
  return process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || null;
}

function postHogHost() {
  return process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://us.posthog.com";
}

export function initializePostHog() {
  if (typeof window === "undefined" || initialized) return null;

  const token = projectToken();
  if (!token) return null;

  posthog.init(token, {
    api_host: "/ingest",
    ui_host: postHogHost(),
    defaults: "2026-01-30",
    autocapture: true,
    capture_pageview: "history_change",
    capture_pageleave: true,
    capture_dead_clicks: true,
    capture_exceptions: true,
    disable_session_recording: false,
    mask_all_element_attributes: true,
    person_profiles: "identified_only",
    persistence: "localStorage+cookie",
  });
  posthog.startSessionRecording(true);
  initialized = true;

  return posthog;
}

export function capturePostHogClientEvent(name: string, properties?: Record<string, unknown>) {
  const client = initializePostHog();
  if (!client) return;

  const eventName = name === "page_view" ? "$pageview" : name;
  client.capture(eventName, cleanMetadata(properties) as Properties);
}

export function identifyPostHogUser(user: {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  plan?: string | null;
  isAdmin?: boolean | null;
}) {
  const client = initializePostHog();
  if (!client || !user.id) return;

  client.identify(user.id, {
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    plan: user.plan ?? undefined,
    is_admin: Boolean(user.isAdmin),
  });
}

export function resetPostHogUser() {
  const client = initializePostHog();
  if (!client) return;
  client.reset();
}
