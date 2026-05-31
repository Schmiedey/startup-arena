"use client";

import { cleanMetadata, normalizedPath } from "@/lib/analytics-shared";
import {
  capturePostHogClientEvent,
  identifyPostHogUser,
  resetPostHogUser,
} from "@/lib/posthog-client";

type EventMetadata = Record<string, string | number | boolean | null | undefined>;

interface ClientUser {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  plan?: string | null;
  isAdmin?: boolean | null;
}

function clientId() {
  const key = "likelyr-client-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

function pageProperties(metadata?: EventMetadata) {
  const searchParams = new URLSearchParams(window.location.search);
  return cleanMetadata({
    ...metadata,
    path: normalizedPath(`${window.location.pathname}${window.location.search}`),
    url: window.location.href,
    $current_url: window.location.href,
    $pathname: window.location.pathname,
    $host: window.location.host,
    title: document.title,
    $title: document.title,
    referrer: document.referrer || null,
    $referrer: document.referrer || null,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    utm_source: searchParams.get("utm_source"),
    utm_medium: searchParams.get("utm_medium"),
    utm_campaign: searchParams.get("utm_campaign"),
    utm_term: searchParams.get("utm_term"),
    utm_content: searchParams.get("utm_content"),
  }) as EventMetadata;
}

export function trackClientEvent(name: string, metadata?: EventMetadata) {
  if (typeof window === "undefined") return;

  const properties = pageProperties(metadata);
  capturePostHogClientEvent(name, properties);

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      name,
      clientId: clientId(),
      path: properties.path,
      referrer: document.referrer || null,
      metadata: properties,
    }),
  }).catch(() => {});
}

export function identifyAnalyticsUser(user: ClientUser | null | undefined) {
  if (typeof window === "undefined") return;

  const key = "likelyr-identified-user";
  if (!user?.id) {
    if (window.localStorage.getItem(key)) {
      resetPostHogUser();
      window.localStorage.removeItem(key);
    }
    return;
  }

  const previous = window.localStorage.getItem(key);
  identifyPostHogUser(user);
  if (previous !== user.id) {
    trackClientEvent("user_identified", {
      plan: user.plan ?? null,
      is_admin: Boolean(user.isAdmin),
    });
  }
  window.localStorage.setItem(key, user.id);
}

export function trackSessionStarted() {
  if (typeof window === "undefined") return;

  const key = "likelyr-session-started-at";
  const now = Date.now();
  const previous = Number(window.sessionStorage.getItem(key) || 0);
  if (previous && now - previous < 30 * 60 * 1000) return;

  window.sessionStorage.setItem(key, String(now));
  trackClientEvent("session_started", {
    language: navigator.language,
    user_agent_family: navigator.userAgent.includes("Mobile") ? "mobile" : "desktop",
  });
}
