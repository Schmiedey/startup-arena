"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ExternalLink,
  Inbox,
  Loader2,
  MessageSquare,
  Newspaper,
  Save,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/types";

type Plan = "free" | "launch" | "pro";

interface PremiumProfile {
  profile_headline: string | null;
  profile_bio: string | null;
  profile_website_url: string | null;
  profile_demo_url: string | null;
  profile_linkedin_url: string | null;
  profile_x_url: string | null;
  profile_cta_label: string | null;
  profile_cta_url: string | null;
  profile_show_contact: boolean;
  profile_weekly_digest_opt_in: boolean;
  profile_featured_category: string | null;
}

interface Summary {
  profile_views: number | string;
  spotlight_impressions: number | string;
  spotlight_clicks: number | string;
  battle_impressions: number | string;
  cta_clicks: number | string;
  leads: number | string;
  updates: number | string;
}

interface IdeaMetric {
  id: string;
  name: string;
  category: string;
  stage: string;
  elo_score: number | string;
  wins: number | string;
  losses: number | string;
  battles: number | string;
  category_rank: number | string;
  category_count: number | string;
  category_avg_elo: number | string;
  category_top_elo: number | string;
  elo_delta_30d: number | string;
  battle_impressions: number | string;
  cta_clicks: number | string;
  spotlight_impressions: number | string;
  spotlight_clicks: number | string;
  leads: number | string;
}

interface VoteHistory {
  created_at: string;
  idea_id: string;
  idea_name: string;
  opponent_name: string;
  winner_name: string;
  won: boolean;
}

interface Lead {
  id: string;
  idea_id: string | null;
  email: string;
  message: string | null;
  source: string | null;
  created_at: string;
}

interface FounderUpdate {
  id: string;
  idea_id: string | null;
  idea_name: string | null;
  title: string;
  body: string;
  created_at: string;
}

interface DigestIdea {
  id: string;
  name: string;
  category: string;
  elo_score: number | string;
  wins: number | string;
  losses: number | string;
  recent_delta: number | string;
}

interface FeedbackItem {
  idea_id: string;
  idea_name: string;
  notes: string[];
}

interface FounderAnalyticsData {
  plan: "launch" | "pro";
  isPro: boolean;
  profile: PremiumProfile;
  summary: Summary;
  ideas: IdeaMetric[];
  voteHistory: VoteHistory[];
  leads: Lead[];
  updates: FounderUpdate[];
  digest: DigestIdea[];
  feedback: FeedbackItem[];
}

function numberValue(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function emptyProfile(): PremiumProfile {
  return {
    profile_headline: "",
    profile_bio: "",
    profile_website_url: "",
    profile_demo_url: "",
    profile_linkedin_url: "",
    profile_x_url: "",
    profile_cta_label: "",
    profile_cta_url: "",
    profile_show_contact: true,
    profile_weekly_digest_opt_in: true,
    profile_featured_category: "",
  };
}

export function PremiumDashboard({ currentPlan }: { currentPlan: Plan }) {
  const [data, setData] = useState<FounderAnalyticsData | null>(null);
  const [loading, setLoading] = useState(currentPlan !== "free");
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<PremiumProfile>(emptyProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [updateIdeaId, setUpdateIdeaId] = useState("");
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  async function loadAnalytics(options: { showLoading?: boolean } = {}) {
    if (currentPlan === "free") return;
    const showLoading = options.showLoading ?? true;
    if (showLoading) setLoading(true);
    if (showLoading) setError(null);
    try {
      const res = await fetch("/api/founder/analytics");
      const loaded = await res.json();
      if (!res.ok) {
        throw new Error(typeof loaded.error === "string" ? loaded.error : "Could not load analytics");
      }
      setData(loaded as FounderAnalyticsData);
      setProfile({
        ...emptyProfile(),
        ...(loaded.profile as PremiumProfile),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (currentPlan === "free") return;
    let cancelled = false;

    fetch("/api/founder/analytics")
      .then(async (res) => {
        const loaded = await res.json();
        if (!res.ok) {
          throw new Error(typeof loaded.error === "string" ? loaded.error : "Could not load analytics");
        }
        return loaded as FounderAnalyticsData;
      })
      .then((loaded) => {
        if (cancelled) return;
        setData(loaded);
        setProfile({
          ...emptyProfile(),
          ...loaded.profile,
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load analytics");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPlan]);

  const feedbackByIdea = useMemo(() => {
    const map = new Map<string, FeedbackItem>();
    data?.feedback.forEach((item) => map.set(item.idea_id, item));
    return map;
  }, [data?.feedback]);

  if (currentPlan === "free") {
    return (
      <div className="mb-8 border border-fire/25 bg-fire/5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-fire/30 bg-background/40 text-fire">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-fire">Paid member tools</p>
              <p className="text-sm text-muted-foreground">Featured placement, richer profile, leads, and analytics.</p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 border border-fire/35 px-3 py-2 text-xs font-bold uppercase tracking-wider text-fire transition-colors hover:bg-fire/10"
          >
            Upgrade
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mb-8 flex items-center justify-center border border-border/30 bg-card/20 p-8">
        <Loader2 className="h-6 w-6 animate-spin text-fire" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mb-8 border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
        {error ?? "Could not load paid member tools."}
      </div>
    );
  }

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          profile_featured_category: profile.profile_featured_category || null,
        }),
      });
      const loaded = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof loaded.error === "string" ? loaded.error : "Could not save profile");
      }
      setProfileMessage("Profile saved.");
      await loadAnalytics();
    } catch (err) {
      setProfileMessage(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function postUpdate(e: React.FormEvent) {
    e.preventDefault();
    setPostingUpdate(true);
    setUpdateMessage(null);
    try {
      const res = await fetch("/api/founder-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updateTitle.trim(),
          body: updateBody.trim(),
          idea_id: updateIdeaId || null,
        }),
      });
      const loaded = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof loaded.error === "string" ? loaded.error : "Could not post update");
      }
      setUpdateTitle("");
      setUpdateBody("");
      setUpdateIdeaId("");
      setUpdateMessage("Update posted.");
      await loadAnalytics();
    } catch (err) {
      setUpdateMessage(err instanceof Error ? err.message : "Could not post update");
    } finally {
      setPostingUpdate(false);
    }
  }

  const statCards = [
    { label: "Profile views", value: data.summary.profile_views },
    { label: "Spotlight views", value: data.summary.spotlight_impressions },
    { label: "Battle card views", value: data.summary.battle_impressions },
    { label: "CTA clicks", value: data.summary.cta_clicks },
    { label: "Leads", value: data.summary.leads },
    { label: "Updates", value: data.summary.updates },
  ];

  return (
    <div className="mb-8 space-y-6">
      <div className="border border-border/30 bg-card/20 p-4">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-fire" />
          <h2 className="text-sm font-bold uppercase tracking-widest">Paid member dashboard</h2>
        </div>
        <div className="grid grid-cols-2 gap-px border border-border/30 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-background/50 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-black">{numberValue(stat.value)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="border border-border/30 bg-card/20 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-fire" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Premium profile</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Headline</span>
              <input
                value={profile.profile_headline ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, profile_headline: e.target.value.slice(0, 90) }))}
                className="w-full border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-fire/50"
                placeholder="What are you building?"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bio</span>
              <textarea
                value={profile.profile_bio ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, profile_bio: e.target.value.slice(0, 600) }))}
                rows={4}
                className="w-full resize-none border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-fire/50"
                placeholder="Short founder bio, what you are testing, and who should reach out."
              />
            </label>
            {([
              ["profile_website_url", "Website URL"],
              ["profile_demo_url", "Demo URL"],
              ["profile_linkedin_url", "LinkedIn URL"],
              ["profile_x_url", "X URL"],
              ["profile_cta_label", "CTA label"],
              ["profile_cta_url", "CTA URL"],
            ] as const).map(([key, label]) => (
              <label key={key} className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                <input
                  value={profile[key] ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value.slice(0, key === "profile_cta_label" ? 40 : 300) }))}
                  className="w-full border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-fire/50"
                />
              </label>
            ))}
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Featured category slot</span>
              <select
                value={profile.profile_featured_category ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, profile_featured_category: e.target.value }))}
                className="w-full border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-fire/50"
              >
                <option value="">Best idea category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2 pt-6">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={Boolean(profile.profile_show_contact)}
                  onChange={(e) => setProfile((p) => ({ ...p, profile_show_contact: e.target.checked }))}
                />
                Show lead form
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={Boolean(profile.profile_weekly_digest_opt_in)}
                  onChange={(e) => setProfile((p) => ({ ...p, profile_weekly_digest_opt_in: e.target.checked }))}
                />
                Weekly digest
              </label>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              onClick={saveProfile}
              disabled={savingProfile}
              className="gap-2 rounded-none btn-fire bg-fire text-fire-foreground hover:bg-fire/90"
            >
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save profile
            </Button>
            {profileMessage && (
              <p className={`text-xs ${profileMessage === "Profile saved." ? "text-emerald-400" : "text-red-400"}`}>
                {profileMessage}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-border/30 bg-card/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-fire" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Weekly digest queue</h3>
            </div>
            {data.digest.length === 0 ? (
              <p className="text-sm text-muted-foreground">Submit an idea to enter the queue.</p>
            ) : (
              <div className="space-y-2">
                {data.digest.map((idea) => (
                  <div key={idea.id} className="border border-border/20 bg-background/30 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{idea.name}</p>
                      <span className={`text-xs font-bold ${numberValue(idea.recent_delta) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {numberValue(idea.recent_delta) >= 0 ? "+" : ""}{numberValue(idea.recent_delta)}
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{idea.category} / {idea.elo_score} Elo</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-border/30 bg-card/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Inbox className="h-4 w-4 text-fire" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Leads</h3>
            </div>
            {data.leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lead requests yet.</p>
            ) : (
              <div className="space-y-2">
                {data.leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="border border-border/20 bg-background/30 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{lead.email}</p>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{shortDate(lead.created_at)}</span>
                    </div>
                    {lead.message && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{lead.message}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {data.isPro && (
        <div className="border border-border/30 bg-card/20 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-fire" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Founder update</h3>
          </div>
          <form onSubmit={postUpdate} className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <input
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value.slice(0, 100))}
              placeholder="Update title"
              required
              className="border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-fire/50"
            />
            <select
              value={updateIdeaId}
              onChange={(e) => setUpdateIdeaId(e.target.value)}
              className="border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-fire/50"
            >
              <option value="">Profile update</option>
              {data.ideas.map((idea) => (
                <option key={idea.id} value={idea.id}>{idea.name}</option>
              ))}
            </select>
            <textarea
              value={updateBody}
              onChange={(e) => setUpdateBody(e.target.value.slice(0, 700))}
              placeholder="Launch note, milestone, customer ask, demo update..."
              required
              rows={3}
              className="resize-none border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-fire/50 sm:col-span-2"
            />
            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center">
              <Button
                type="submit"
                disabled={postingUpdate}
                className="gap-2 rounded-none btn-fire bg-fire text-fire-foreground hover:bg-fire/90"
              >
                {postingUpdate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Newspaper className="h-4 w-4" />}
                Post update
              </Button>
              {updateMessage && (
                <p className={`text-xs ${updateMessage === "Update posted." ? "text-emerald-400" : "text-red-400"}`}>
                  {updateMessage}
                </p>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="border border-border/30 bg-card/20 p-4">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-fire" />
          <h3 className="text-sm font-bold uppercase tracking-widest">Idea analytics</h3>
        </div>
        {data.ideas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ideas yet.</p>
        ) : (
          <div className="space-y-3">
            {data.ideas.map((idea) => {
              const wins = numberValue(idea.wins);
              const losses = numberValue(idea.losses);
              const battles = wins + losses;
              const winRate = battles > 0 ? Math.round((wins / battles) * 100) : 0;
              const feedback = feedbackByIdea.get(idea.id);
              return (
                <div key={idea.id} className="border border-border/20 bg-background/30 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{idea.name}</p>
                      <p className="text-xs text-muted-foreground">
                        #{idea.category_rank} of {idea.category_count} in {idea.category} / {idea.elo_score} Elo / {winRate}% win
                      </p>
                    </div>
                    <div className={`text-sm font-bold ${numberValue(idea.elo_delta_30d) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {numberValue(idea.elo_delta_30d) >= 0 ? "+" : ""}{numberValue(idea.elo_delta_30d)} Elo 30d
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-px border border-border/20 sm:grid-cols-6">
                    {[
                      ["Views", idea.battle_impressions],
                      ["Spotlight", idea.spotlight_impressions],
                      ["Clicks", idea.cta_clicks],
                      ["Leads", idea.leads],
                      ["Cat avg", idea.category_avg_elo],
                      ["Cat top", idea.category_top_elo],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-card/20 p-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                        <p className="text-sm font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                  {feedback?.notes.length ? (
                    <div className="mt-3 border border-fire/15 bg-fire/5 p-2">
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-fire">
                        <MessageSquare className="h-3 w-3" />
                        Private feedback
                      </div>
                      <ul className="space-y-1">
                        {feedback.notes.map((note) => (
                          <li key={note} className="text-xs text-muted-foreground">{note}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-border/30 bg-card/20 p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest">Recent vote history</h3>
          {data.voteHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No votes against your ideas yet.</p>
          ) : (
            <div className="space-y-2">
              {data.voteHistory.slice(0, 8).map((vote, index) => (
                <div key={`${vote.created_at}-${index}`} className="border border-border/20 bg-background/30 p-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className={vote.won ? "font-semibold text-emerald-400" : "font-semibold text-red-400"}>
                      {vote.won ? "Won" : "Lost"}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{shortDate(vote.created_at)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {vote.idea_name} vs {vote.opponent_name}. Winner: {vote.winner_name}.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-border/30 bg-card/20 p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest">Founder updates</h3>
          {data.updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public updates yet.</p>
          ) : (
            <div className="space-y-2">
              {data.updates.slice(0, 6).map((update) => (
                <div key={update.id} className="border border-border/20 bg-background/30 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{update.title}</p>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{shortDate(update.created_at)}</span>
                  </div>
                  {update.idea_name && <p className="text-[10px] uppercase tracking-wider text-fire">{update.idea_name}</p>}
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{update.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
