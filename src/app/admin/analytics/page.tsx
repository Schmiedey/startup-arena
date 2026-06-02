"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import {
  AlertTriangle,
  Activity,
  BarChart3,
  CreditCard,
  Crown,
  DollarSign,
  ExternalLink,
  Eye,
  Lightbulb,
  MousePointer2,
  Share2,
  Users,
  Vote,
  Zap,
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

interface RevenueSummary {
  gross_revenue_cents: number;
  launch_revenue_cents: number;
  pro_revenue_cents: number;
  checkout_started: number;
  checkout_completed: number;
  launch_purchases: number;
  pro_purchases: number;
  launch_users: number;
  pro_users: number;
  paid_users: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  attention_subscriptions: number;
}

interface PlanBreakdownRow {
  plan: "free" | "launch" | "pro";
  users: number;
}

interface SubscriptionStatusRow {
  status: string;
  users: number;
}

interface CheckoutByPlanRow {
  plan: string;
  started: number;
  completed: number;
  revenue_cents: number;
}

interface PaidUserRow {
  id: string;
  name: string | null;
  email: string;
  plan: "free" | "launch" | "pro";
  subscription_status: string | null;
  launch_pass_purchased_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  ideas: number;
  votes: number;
  last_paid_event_at: string | null;
}

interface PaidTimelineRow {
  day: string;
  name: string;
  plan: string;
  count: number;
  revenue_cents: number;
}

interface FeatureUsageRow {
  name: string;
  segment: string;
  count: number;
}

interface EntitlementAudit {
  free_over_limit: number;
  launch_over_limit: number;
  pro_without_active_subscription: number;
  pro_status_mismatch: number;
  launch_limit_ok: number;
  pro_unlimited_ok: number;
}

interface PaymentEventRow {
  name: string;
  user_id: string | null;
  path: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface BotInventory {
  users: number | string;
  ideas: number | string;
  votes: number | string;
  comments: number | string;
  predictors: number | string;
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
  revenue: RevenueSummary;
  planBreakdown: PlanBreakdownRow[];
  subscriptionStatuses: SubscriptionStatusRow[];
  checkoutByPlan: CheckoutByPlanRow[];
  paidUsers: PaidUserRow[];
  paidTimeline: PaidTimelineRow[];
  featureUsage: FeatureUsageRow[];
  entitlementAudit: EntitlementAudit;
  paymentEvents: PaymentEventRow[];
  botInventory: BotInventory;
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
  checkout_cta_clicked: "Checkout CTA",
  billing_portal_opened: "Billing portal",
  subscription_updated: "Subscription updated",
  subscription_deleted: "Subscription deleted",
  idea_limit_hit: "Idea limit hit",
  challenge_share_clicked: "Challenge shared",
  challenge_link_upgrade_clicked: "Challenge upgrade",
  category_battle_upgrade_clicked: "Category upgrade",
  battle_created: "Battles created",
};

const funnelLabels: Record<string, string> = {
  visited: "Visited",
  signed_up: "Signed up",
  submitted_idea: "Submitted idea",
  voted: "Voted",
  started_checkout: "Started checkout",
  paid: "Paid",
};

function money(cents: number | string | null | undefined) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    Number(cents ?? 0) / 100
  );
}

function percent(part: number, whole: number) {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

function formatMetadata(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata).slice(0, 4);
  if (!entries.length) return "No metadata";
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" · ");
}

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
          <div className="mb-4 border border-sky-400/20 bg-sky-400/5 px-4 py-3 text-xs text-sky-200">
            Real-user analytics exclude seeded bot/demo accounts and admin-owned records. Bot/demo inventory: {Number(data.botInventory.users)} users,
            {` ${Number(data.botInventory.ideas)} ideas, ${Number(data.botInventory.votes)} votes, ${Number(data.botInventory.comments)} comments, ${Number(data.botInventory.predictors)} predictors.`}
          </div>

          <div className="grid grid-cols-2 gap-px border border-border/30 sm:grid-cols-4 lg:grid-cols-8">
            {[
              { label: "Events", value: data.summary.total_events, icon: BarChart3, color: "text-blue-400" },
              { label: "Visitors", value: data.summary.unique_visitors, icon: Users, color: "text-sky-400" },
              { label: "Real users", value: data.summary.signed_in_users, icon: Users, color: "text-violet-400" },
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
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider">Paid Subscription Command Center</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {data.days} day window
              </span>
            </div>
            <div className="grid gap-px border border-border/30 sm:grid-cols-2 lg:grid-cols-6">
              {[
                { label: "Gross revenue", value: money(data.revenue.gross_revenue_cents), detail: "completed checkout", icon: DollarSign, color: "text-emerald-400" },
                { label: "Launch revenue", value: money(data.revenue.launch_revenue_cents), detail: `${data.revenue.launch_purchases} purchases`, icon: Zap, color: "text-fire" },
                { label: "Pro revenue", value: money(data.revenue.pro_revenue_cents), detail: `${data.revenue.pro_purchases} purchases`, icon: Crown, color: "text-violet-400" },
                { label: "Paid users", value: data.revenue.paid_users, detail: `${data.revenue.launch_users} launch / ${data.revenue.pro_users} pro`, icon: Users, color: "text-sky-400" },
                { label: "Active subs", value: data.revenue.active_subscriptions, detail: `${data.revenue.trialing_subscriptions} trialing`, icon: Activity, color: "text-emerald-400" },
                { label: "Needs attention", value: data.revenue.attention_subscriptions, detail: "past due/unpaid/incomplete", icon: AlertTriangle, color: data.revenue.attention_subscriptions ? "text-red-400" : "text-muted-foreground" },
              ].map(({ label, value, detail, icon: Icon, color }) => (
                <div key={label} className="bg-card/30 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                  </div>
                  <p className="text-2xl font-black font-[family-name:var(--font-chakra)]">{value}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Plan Mix</h4>
                <div className="space-y-1">
                  {data.planBreakdown.map((row) => (
                    <div key={row.plan} className="flex items-center justify-between border border-border/20 bg-card/10 px-3 py-2 text-xs">
                      <span className="font-semibold uppercase">{row.plan}</span>
                      <span className="text-fire font-bold">{row.users}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subscription Status</h4>
                <div className="space-y-1">
                  {data.subscriptionStatuses.map((row) => (
                    <div key={row.status} className="flex items-center justify-between border border-border/20 bg-card/10 px-3 py-2 text-xs">
                      <span className="font-semibold uppercase">{row.status}</span>
                      <span className="text-fire font-bold">{row.users}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Entitlement Audit</h4>
                <div className="space-y-1">
                  {[
                    ["Free users over 1 idea", data.entitlementAudit.free_over_limit],
                    ["Launch users over 5 ideas", data.entitlementAudit.launch_over_limit],
                    ["Pro without active sub", data.entitlementAudit.pro_without_active_subscription],
                    ["Pro status mismatches", data.entitlementAudit.pro_status_mismatch],
                    ["Launch limit OK", data.entitlementAudit.launch_limit_ok],
                    ["Pro unlimited OK", data.entitlementAudit.pro_unlimited_ok],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between border border-border/20 bg-card/10 px-3 py-2 text-xs">
                      <span>{label}</span>
                      <span className={`font-bold ${Number(value) > 0 && String(label).includes("over") ? "text-red-400" : "text-fire"}`}>{Number(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Checkout Funnel by Plan</h4>
                <div className="space-y-1">
                  {data.checkoutByPlan.map((row) => (
                    <div key={row.plan} className="border border-border/20 bg-card/10 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{row.plan}</span>
                        <span className="text-fire font-bold">{money(row.revenue_cents)}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {row.started} started · {row.completed} completed · {percent(row.completed, row.started)} conversion
                      </p>
                    </div>
                  ))}
                  {data.checkoutByPlan.length === 0 && <p className="text-xs text-muted-foreground">No checkout activity in this window.</p>}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Paid Users</h4>
                <div className="overflow-x-auto border border-border/30">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="border-b border-border/30 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">User</th>
                        <th className="px-3 py-2">Plan</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Ideas</th>
                        <th className="px-3 py-2 text-right">Votes</th>
                        <th className="px-3 py-2">Last paid event</th>
                        <th className="px-3 py-2">Stripe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.paidUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border/10">
                          <td className="px-3 py-2">
                            <p className="font-semibold">{user.name || "Anonymous"}</p>
                            <p className="text-muted-foreground">{user.email}</p>
                          </td>
                          <td className="px-3 py-2 font-bold uppercase text-fire">{user.plan}</td>
                          <td className="px-3 py-2">{user.subscription_status || (user.launch_pass_purchased_at ? "paid once" : "none")}</td>
                          <td className="px-3 py-2 text-right">{user.ideas}</td>
                          <td className="px-3 py-2 text-right">{user.votes}</td>
                          <td className="px-3 py-2">{user.last_paid_event_at ? new Date(user.last_paid_event_at).toLocaleDateString() : "none"}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {user.stripe_subscription_id ? "subscription" : user.stripe_customer_id ? "customer" : "none"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Paid Feature Usage</h4>
                <div className="grid gap-1 sm:grid-cols-2">
                  {data.featureUsage.map((row) => (
                    <div key={`${row.name}-${row.segment}`} className="flex items-center justify-between gap-3 border border-border/20 bg-card/10 px-3 py-2 text-xs">
                      <span className="truncate">{eventLabels[row.name] ?? row.name} · {row.segment}</span>
                      <span className="font-bold text-fire">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Paid Timeline</h4>
                <div className="max-h-72 overflow-auto border border-border/30">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="sticky top-0 border-b border-border/30 bg-background text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Day</th>
                        <th className="px-3 py-2">Event</th>
                        <th className="px-3 py-2">Plan</th>
                        <th className="px-3 py-2 text-right">Count</th>
                        <th className="px-3 py-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.paidTimeline.map((row) => (
                        <tr key={`${row.day}-${row.name}-${row.plan}`} className="border-b border-border/10">
                          <td className="px-3 py-2">{new Date(row.day).toLocaleDateString()}</td>
                          <td className="px-3 py-2">{eventLabels[row.name] ?? row.name}</td>
                          <td className="px-3 py-2">{row.plan}</td>
                          <td className="px-3 py-2 text-right">{row.count}</td>
                          <td className="px-3 py-2 text-right font-bold text-fire">{money(row.revenue_cents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Payment Events</h4>
                <div className="grid gap-1 lg:grid-cols-2">
                  {data.paymentEvents.slice(0, 20).map((event, index) => (
                    <div key={`${event.created_at}-${index}`} className="border border-border/20 bg-card/10 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{eventLabels[event.name] ?? event.name}</span>
                        <span className="text-muted-foreground">{new Date(event.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 truncate text-muted-foreground">{formatMetadata(event.metadata)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
