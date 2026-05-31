"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  ExternalLink,
  Eye,
  Lightbulb,
  MousePointer2,
  Share2,
  Users,
  Vote,
} from "lucide-react";

interface AnalyticsSummary {
  total_events: number;
  unique_visitors: number;
  signed_in_users: number;
  page_views: number;
  sessions: number;
  signups: number;
  idea_submits: number;
  votes: number;
  clicks: number;
  checkout_started: number;
  checkout_completed: number;
  client_errors: number;
}

interface CountRow {
  name: string;
  count: number;
}

interface DailyRow extends CountRow {
  day: string;
}

interface PageRow {
  path: string;
  count: number;
}

interface ReferrerRow {
  referrer: string;
  count: number;
}

interface FunnelRow {
  step_order: number;
  step: string;
  count: number;
}

interface RecentRow {
  name: string;
  path: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface AnalyticsData {
  days: number;
  summary: AnalyticsSummary;
  byName: CountRow[];
  daily: DailyRow[];
  topPages: PageRow[];
  topReferrers: ReferrerRow[];
  funnel: FunnelRow[];
  recent: RecentRow[];
}

const eventLabels: Record<string, string> = {
  page_view: "Page views",
  session_started: "Sessions",
  user_signed_up: "Sign ups",
  user_signed_in: "Sign ins",
  user_identified: "Identified users",
  idea_submitted: "Ideas submitted",
  idea_submit_completed: "Submit success",
  vote_created: "Votes",
  vote_completed: "Vote success",
  ui_clicked: "Clicks",
  web_vital: "Web vitals",
  client_error: "Client errors",
  checkout_started: "Checkout started",
  checkout_completed: "Checkout completed",
};

const funnelLabels: Record<string, string> = {
  visited: "Visited",
  signed_up: "Signed up",
  submitted_idea: "Submitted idea",
  voted: "Voted",
  started_checkout: "Started checkout",
  paid: "Paid",
};

const postHogProjectUrl = "https://us.posthog.com/project/446290";

const postHogLinks = [
  { label: "Command", href: `${postHogProjectUrl}/dashboard/1646417`, icon: BarChart3 },
  { label: "Scorecard", href: `${postHogProjectUrl}/insights/sHNcti7O`, icon: Users },
  { label: "Growth", href: `${postHogProjectUrl}/insights/uPEeXLnT`, icon: Vote },
  { label: "Acquisition", href: `${postHogProjectUrl}/insights/I2c9Dodi`, icon: Share2 },
  { label: "Pages", href: `${postHogProjectUrl}/insights/7PQRks5U`, icon: Eye },
  { label: "Activation", href: `${postHogProjectUrl}/insights/ZibBz9uJ`, icon: Lightbulb },
  { label: "Engagement", href: `${postHogProjectUrl}/insights/2ZbEnKca`, icon: MousePointer2 },
  { label: "Revenue", href: `${postHogProjectUrl}/insights/imKgRjPs`, icon: CreditCard },
  { label: "UX Quality", href: `${postHogProjectUrl}/insights/XwZg0Ybq`, icon: AlertTriangle },
  { label: "Events", href: `${postHogProjectUrl}/insights/gSYPL1YL`, icon: BarChart3 },
];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/analytics?days=${days}`)
      .then((res): Promise<AnalyticsData> => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  const maxEventCount = useMemo(() => {
    if (!data?.byName.length) return 1;
    return Math.max(...data.byName.map((event) => Number(event.count)), 1);
  }, [data]);

  const firstFunnelCount = Number(data?.funnel[0]?.count ?? 0) || 1;

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider">Product Analytics</h2>
          <p className="mt-1 text-xs text-muted-foreground">First-party events plus PostHog-ready product telemetry.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`${postHogProjectUrl}/dashboard/1646417`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 border border-border/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-fire/50 hover:text-fire"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            PostHog
            <ExternalLink className="h-3 w-3" />
          </a>
          <div className="flex border border-border/40">
            {[7, 30, 90].map((value) => (
              <button
                key={value}
                onClick={() => {
                  setLoading(true);
                  setDays(value);
                }}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                  days === value ? "bg-fire text-fire-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-px border border-border/30 sm:grid-cols-2 lg:grid-cols-5">
        {postHogLinks.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between gap-3 bg-card/20 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-panel/20 hover:text-fire"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
          </a>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading...</div>
      ) : !data ? (
        <div className="py-20 text-center text-muted-foreground">Failed to load analytics</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-px border border-border/30 sm:grid-cols-4 lg:grid-cols-8">
            {[
              { label: "Events", value: data.summary.total_events, icon: BarChart3, color: "text-blue-400" },
              { label: "Visitors", value: data.summary.unique_visitors, icon: Users, color: "text-sky-400" },
              { label: "Users", value: data.summary.signed_in_users, icon: Users, color: "text-violet-400" },
              { label: "Views", value: data.summary.page_views, icon: Eye, color: "text-emerald-400" },
              { label: "Signups", value: data.summary.signups, icon: Users, color: "text-emerald-400" },
              { label: "Ideas", value: data.summary.idea_submits, icon: Lightbulb, color: "text-fire" },
              { label: "Votes", value: data.summary.votes, icon: Vote, color: "text-amber-400" },
              { label: "Checkout", value: data.summary.checkout_started, icon: CreditCard, color: "text-violet-400" },
              { label: "Paid", value: data.summary.checkout_completed, icon: MousePointer2, color: "text-emerald-400" },
              { label: "Errors", value: data.summary.client_errors, icon: AlertTriangle, color: "text-red-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card/30 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                </div>
                <p className="text-2xl font-black font-[family-name:var(--font-chakra)]">{Number(value)}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider">Activation Funnel</h3>
            <div className="grid gap-px border border-border/30 sm:grid-cols-3 lg:grid-cols-6">
              {data.funnel.map((step) => {
                const percent = Math.round((Number(step.count) / firstFunnelCount) * 100);
                return (
                  <div key={step.step} className="bg-card/20 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{funnelLabels[step.step] ?? step.step}</p>
                    <p className="mt-1 text-2xl font-black font-[family-name:var(--font-chakra)]">{Number(step.count)}</p>
                    <div className="mt-3 h-1.5 bg-border/30">
                      <div className="h-full bg-fire" style={{ width: `${Math.max(4, Math.min(100, percent))}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{percent}% of visitors</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider">Events</h3>
              <div className="space-y-2">
                {data.byName.map((event) => (
                  <div key={event.name} className="border border-border/20 bg-card/10 px-3 py-2">
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold">{eventLabels[event.name] ?? event.name}</span>
                      <span className="text-muted-foreground">{event.count}</span>
                    </div>
                    <div className="h-1.5 bg-border/30">
                      <div
                        className="h-full bg-fire"
                        style={{ width: `${Math.max(4, (Number(event.count) / maxEventCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider">Top Pages</h3>
              <div className="space-y-1">
                {data.topPages.map((page) => (
                  <div key={page.path} className="flex items-center justify-between gap-3 border border-border/20 bg-card/10 px-3 py-2 text-xs">
                    <span className="truncate">{page.path}</span>
                    <span className="shrink-0 font-bold text-fire">{page.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider">Top Referrers</h3>
            <div className="grid gap-1 sm:grid-cols-2">
              {data.topReferrers.map((referrer) => (
                <div key={referrer.referrer} className="flex items-center justify-between gap-3 border border-border/20 bg-card/10 px-3 py-2 text-xs">
                  <span className="truncate">{referrer.referrer}</span>
                  <span className="shrink-0 font-bold text-fire">{referrer.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider">Daily Funnel</h3>
            <div className="overflow-x-auto border border-border/30">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="border-b border-border/30 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Day</th>
                    <th className="px-3 py-2">Event</th>
                    <th className="px-3 py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily.map((row) => (
                    <tr key={`${row.day}-${row.name}`} className="border-b border-border/10">
                      <td className="px-3 py-2">{new Date(row.day).toLocaleDateString()}</td>
                      <td className="px-3 py-2">{eventLabels[row.name] ?? row.name}</td>
                      <td className="px-3 py-2 text-right font-bold">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider">Recent Events</h3>
            <div className="space-y-1">
              {data.recent.map((event, index) => (
                <div key={`${event.created_at}-${index}`} className="flex items-center justify-between gap-3 border border-border/20 bg-card/10 px-3 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold">{eventLabels[event.name] ?? event.name}</p>
                    <p className="truncate text-muted-foreground">{event.path ?? "No path"}</p>
                  </div>
                  <span className="shrink-0 text-muted-foreground">{new Date(event.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
