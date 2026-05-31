"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useSession } from "next-auth/react";
import {
  identifyAnalyticsUser,
  trackClientEvent,
  trackSessionStarted,
} from "@/lib/analytics-client";

function readableLabel(element: HTMLElement) {
  return (
    element.dataset.analytics ||
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.textContent ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useReportWebVitals((metric) => {
    trackClientEvent("web_vital", {
      metric_name: metric.name,
      metric_id: metric.id,
      value: Math.round(metric.value),
      rating: "rating" in metric ? metric.rating : null,
      navigation_type: "navigationType" in metric ? metric.navigationType : null,
    });
  });

  useEffect(() => {
    trackSessionStarted();
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    identifyAnalyticsUser(session?.user ?? null);
  }, [session?.user, status]);

  useEffect(() => {
    const search = searchParams.toString();
    trackClientEvent("page_view", {
      path: `${pathname}${search ? `?${search}` : ""}`,
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("a[href],button,[role='button'],[data-analytics]")
        : null;
      if (!target || target.closest("[data-no-analytics]")) return;

      const href = target instanceof HTMLAnchorElement ? target.getAttribute("href") : null;
      trackClientEvent("ui_clicked", {
        label: readableLabel(target),
        tag: target.tagName.toLowerCase(),
        href,
        page: pathname,
        analytics_id: target.dataset.analytics ?? null,
      });
    }

    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [pathname]);

  return null;
}
