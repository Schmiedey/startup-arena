"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Pencil,
  RefreshCw,
  Send,
  ToggleLeft,
  ToggleRight,
  Users,
} from "lucide-react";

type SegmentKey =
  | "all_users"
  | "no_idea"
  | "inactive_battle_7d"
  | "free_users"
  | "launch_users"
  | "pro_users"
  | "paid_founders"
  | "active_founders";

interface Segment {
  key: SegmentKey;
  name: string;
  description: string;
  count: number;
}

interface Automation {
  key: string;
  name: string;
  segment_key: SegmentKey;
  enabled: boolean;
  frequency: "weekly";
  subject: string;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  last_run_at: string | null;
  updated_at: string;
}

interface Campaign {
  id: string;
  segment_key: SegmentKey;
  subject: string;
  status: "draft" | "sending" | "sent" | "failed";
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at: string | null;
  error: string | null;
}

interface DeliveryStat {
  status: string;
  count: number;
}

interface EmailSuiteData {
  configured: boolean;
  segments: Segment[];
  automations: Automation[];
  campaigns: Campaign[];
  deliveryStats: DeliveryStat[];
}

const emptyCampaign = {
  segmentKey: "all_users" as SegmentKey,
  subject: "",
  body: "",
  ctaLabel: "",
  ctaUrl: "",
};

function dateLabel(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function statValue(stats: DeliveryStat[], status: string) {
  return Number(stats.find((item) => item.status === status)?.count ?? 0);
}

export default function AdminEmailPage() {
  const [data, setData] = useState<EmailSuiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [campaign, setCampaign] = useState(emptyCampaign);
  const [selectedAutomationKey, setSelectedAutomationKey] = useState<string | null>(null);
  const [automationDraft, setAutomationDraft] = useState<Partial<Automation>>({});

  async function loadEmailSuite() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/email");
      const loaded = await res.json();
      if (!res.ok) throw new Error(loaded.error ?? "Failed to load email suite");
      setData(loaded);
      setSelectedAutomationKey((current) => current ?? loaded.automations?.[0]?.key ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load email suite");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialEmailSuite() {
      try {
        const res = await fetch("/api/admin/email");
        const loaded = await res.json();
        if (!res.ok) throw new Error(loaded.error ?? "Failed to load email suite");
        if (cancelled) return;
        setData(loaded);
        setSelectedAutomationKey(loaded.automations?.[0]?.key ?? null);
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Failed to load email suite");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitialEmailSuite();
    return () => {
      cancelled = true;
    };
  }, []);

  const segmentByKey = useMemo(() => {
    const map = new Map<SegmentKey, Segment>();
    data?.segments.forEach((segment) => map.set(segment.key, segment));
    return map;
  }, [data?.segments]);

  const selectedAutomation = data?.automations.find((automation) => automation.key === selectedAutomationKey) ?? null;
  const activeAutomationDraft = selectedAutomation
    ? {
        subject: automationDraft.subject ?? selectedAutomation.subject,
        body: automationDraft.body ?? selectedAutomation.body,
        cta_label: automationDraft.cta_label ?? selectedAutomation.cta_label ?? "",
        cta_url: automationDraft.cta_url ?? selectedAutomation.cta_url ?? "",
      }
    : null;

  async function toggleAutomation(automation: Automation) {
    setSavingKey(automation.key);
    setMessage("");
    try {
      const res = await fetch("/api/admin/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: automation.key, enabled: !automation.enabled }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to update automation");
      await loadEmailSuite();
      setMessage(!automation.enabled ? "Weekly email enabled" : "Weekly email disabled");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update automation");
    } finally {
      setSavingKey(null);
    }
  }

  async function saveAutomation() {
    if (!selectedAutomation || !activeAutomationDraft) return;
    setSavingKey(selectedAutomation.key);
    setMessage("");
    try {
      const res = await fetch("/api/admin/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: selectedAutomation.key,
          subject: activeAutomationDraft.subject,
          body: activeAutomationDraft.body,
          ctaLabel: activeAutomationDraft.cta_label,
          ctaUrl: activeAutomationDraft.cta_url,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to save automation");
      setAutomationDraft({});
      await loadEmailSuite();
      setMessage("Automation saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save automation");
    } finally {
      setSavingKey(null);
    }
  }

  async function sendCampaign() {
    const segment = segmentByKey.get(campaign.segmentKey);
    const count = segment?.count ?? 0;
    if (!count) {
      setMessage("That segment has no opted-in users.");
      return;
    }
    if (!confirm(`Send this email to up to ${Math.min(count, 100)} users in "${segment?.name}"?`)) return;

    setSending(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaign),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to send campaign");
      setCampaign(emptyCampaign);
      await loadEmailSuite();
      setMessage(`Sent ${result.sent} of ${result.attempted}. Failed ${result.failed}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send campaign");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-fire" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-200">
          {message || "Failed to load email suite"}
        </div>
      </AdminLayout>
    );
  }

  const selectedCampaignSegment = segmentByKey.get(campaign.segmentKey);
  const sent30 = statValue(data.deliveryStats, "sent");
  const failed30 = statValue(data.deliveryStats, "failed");

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider">Email Suite</h2>
          <p className="mt-1 text-xs text-muted-foreground">Campaigns, weekly automations, segments, and delivery history.</p>
        </div>
        <button
          onClick={() => void loadEmailSuite()}
          className="inline-flex items-center gap-1.5 border border-border/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-fire/50 hover:text-fire"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {!data.configured && (
        <div className="mb-5 flex items-start gap-3 border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <span>Gmail sending is not configured. You can edit settings, but sends will fail until Gmail env vars are set.</span>
        </div>
      )}

      {message && (
        <div className="mb-5 border border-border/30 bg-card/20 px-4 py-3 text-sm text-muted-foreground">
          {message}
        </div>
      )}

      <div className="grid gap-px border border-border/30 sm:grid-cols-4">
        {[
          { label: "Segments", value: data.segments.length, icon: Users, color: "text-blue-400" },
          { label: "Automations", value: data.automations.filter((item) => item.enabled).length, icon: Clock, color: "text-amber-400" },
          { label: "Sent 30d", value: sent30, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Failed 30d", value: failed30, icon: AlertTriangle, color: "text-red-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card/25 p-4">
            <div className="mb-1 flex items-center gap-2">
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-black font-[family-name:var(--font-chakra)]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Send className="h-4 w-4 text-fire" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Compose</h3>
          </div>
          <div className="space-y-4 border border-border/30 bg-card/15 p-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Segment</span>
                <select
                  value={campaign.segmentKey}
                  onChange={(event) => setCampaign((current) => ({ ...current, segmentKey: event.target.value as SegmentKey }))}
                  className="w-full border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-fire/60"
                >
                  {data.segments.map((segment) => (
                    <option key={segment.key} value={segment.key}>
                      {segment.name} ({segment.count})
                    </option>
                  ))}
                </select>
              </label>
              <div className="border border-border/30 bg-background/35 p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Recipients</p>
                <p className="mt-1 text-xl font-black">{Math.min(selectedCampaignSegment?.count ?? 0, 100)}</p>
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</span>
              <input
                value={campaign.subject}
                onChange={(event) => setCampaign((current) => ({ ...current, subject: event.target.value }))}
                maxLength={120}
                className="w-full border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-fire/60"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</span>
              <textarea
                value={campaign.body}
                onChange={(event) => setCampaign((current) => ({ ...current, body: event.target.value }))}
                rows={8}
                maxLength={2000}
                placeholder="Use {{name}} to personalize."
                className="w-full resize-y border border-border/50 bg-background/70 px-3 py-2 text-sm leading-relaxed outline-none focus:border-fire/60"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">CTA label</span>
                <input
                  value={campaign.ctaLabel}
                  onChange={(event) => setCampaign((current) => ({ ...current, ctaLabel: event.target.value }))}
                  maxLength={60}
                  className="w-full border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-fire/60"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">CTA URL</span>
                <input
                  value={campaign.ctaUrl}
                  onChange={(event) => setCampaign((current) => ({ ...current, ctaUrl: event.target.value }))}
                  maxLength={300}
                  className="w-full border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-fire/60"
                />
              </label>
            </div>

            <button
              onClick={() => void sendCampaign()}
              disabled={sending || !campaign.subject.trim() || campaign.body.trim().length < 10}
              className="inline-flex h-10 items-center gap-2 bg-fire px-4 text-sm font-bold text-fire-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send campaign
            </button>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Segments</h3>
          </div>
          <div className="space-y-1">
            {data.segments.map((segment) => (
              <button
                key={segment.key}
                onClick={() => setCampaign((current) => ({ ...current, segmentKey: segment.key }))}
                className={`w-full border px-3 py-3 text-left transition-colors ${
                  campaign.segmentKey === segment.key
                    ? "border-fire/50 bg-fire/5"
                    : "border-border/20 bg-card/10 hover:border-border/50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{segment.name}</span>
                  <span className="font-mono text-xs text-fire">{segment.count}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{segment.description}</p>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1fr]">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Weekly Automations</h3>
          </div>
          <div className="space-y-1">
            {data.automations.map((automation) => (
              <div
                key={automation.key}
                className={`border px-3 py-3 ${
                  selectedAutomationKey === automation.key ? "border-amber-400/40 bg-amber-400/5" : "border-border/20 bg-card/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => void toggleAutomation(automation)}
                    disabled={savingKey === automation.key}
                    className="mt-0.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    title={automation.enabled ? "Disable" : "Enable"}
                  >
                    {savingKey === automation.key ? (
                      <Loader2 className="h-5 w-5 animate-spin text-fire" />
                    ) : automation.enabled ? (
                      <ToggleRight className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAutomationKey(automation.key);
                      setAutomationDraft({});
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{automation.name}</span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {segmentByKey.get(automation.segment_key)?.count ?? 0}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{automation.subject}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                      Last run: {dateLabel(automation.last_run_at)}
                    </p>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Pencil className="h-4 w-4 text-fire" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Automation Copy</h3>
          </div>
          {selectedAutomation && activeAutomationDraft ? (
            <div className="space-y-4 border border-border/30 bg-card/15 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{selectedAutomation.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {segmentByKey.get(selectedAutomation.segment_key)?.name ?? selectedAutomation.segment_key}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  selectedAutomation.enabled ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"
                }`}>
                  {selectedAutomation.enabled ? "Enabled" : "Off"}
                </span>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</span>
                <input
                  value={activeAutomationDraft.subject}
                  onChange={(event) => setAutomationDraft((current) => ({ ...current, subject: event.target.value }))}
                  maxLength={120}
                  className="w-full border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-fire/60"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</span>
                <textarea
                  value={activeAutomationDraft.body}
                  onChange={(event) => setAutomationDraft((current) => ({ ...current, body: event.target.value }))}
                  rows={6}
                  maxLength={2000}
                  className="w-full resize-y border border-border/50 bg-background/70 px-3 py-2 text-sm leading-relaxed outline-none focus:border-fire/60"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">CTA label</span>
                  <input
                    value={activeAutomationDraft.cta_label}
                    onChange={(event) => setAutomationDraft((current) => ({ ...current, cta_label: event.target.value }))}
                    maxLength={60}
                    className="w-full border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-fire/60"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">CTA URL</span>
                  <input
                    value={activeAutomationDraft.cta_url}
                    onChange={(event) => setAutomationDraft((current) => ({ ...current, cta_url: event.target.value }))}
                    maxLength={300}
                    className="w-full border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-fire/60"
                  />
                </label>
              </div>

              <button
                onClick={() => void saveAutomation()}
                disabled={savingKey === selectedAutomation.key}
                className="inline-flex h-10 items-center gap-2 border border-border/40 px-4 text-sm font-bold text-muted-foreground hover:border-fire/50 hover:text-fire disabled:opacity-50"
              >
                {savingKey === selectedAutomation.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                Save automation
              </button>
            </div>
          ) : (
            <div className="border border-border/30 bg-card/15 p-5 text-sm text-muted-foreground">
              Select an automation.
            </div>
          )}
        </section>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider">History</h3>
        </div>
        {data.campaigns.length === 0 ? (
          <div className="border border-border/30 bg-card/15 p-5 text-sm text-muted-foreground">
            No campaigns sent yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border/30">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-card/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Subject</th>
                  <th className="px-3 py-2 text-left">Segment</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Sent</th>
                  <th className="px-3 py-2 text-right">Failed</th>
                  <th className="px-3 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((item) => (
                  <tr key={item.id} className="border-t border-border/20">
                    <td className="max-w-[320px] truncate px-3 py-2 font-medium">{item.subject}</td>
                    <td className="px-3 py-2 text-muted-foreground">{segmentByKey.get(item.segment_key)?.name ?? item.segment_key}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.status === "sent"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : item.status === "failed"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{item.sent_count}</td>
                    <td className="px-3 py-2 text-right font-mono">{item.failed_count}</td>
                    <td className="px-3 py-2 text-muted-foreground">{dateLabel(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
