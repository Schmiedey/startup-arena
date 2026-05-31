import { capturePostHogClientEvent, initializePostHog } from "./lib/posthog-client";

initializePostHog();

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    capturePostHogClientEvent("client_error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    capturePostHogClientEvent("client_error", {
      message: event.reason instanceof Error ? event.reason.message : String(event.reason),
      unhandled_rejection: true,
    });
  });
}

export function onRouterTransitionStart(url: string, navigationType: "push" | "replace" | "traverse") {
  capturePostHogClientEvent("route_change_started", {
    url,
    navigation_type: navigationType,
  });
}
