"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Idea, CATEGORY_COLORS, STAGE_COLORS } from "@/lib/types";
import { getWinRate, getSurvivalRating, formatElo } from "@/lib/elo";
import { formatPredictionTier, getPredictionAccuracy } from "@/lib/prediction";
import Link from "next/link";
import { Plus, ExternalLink, Loader2, Camera, Check, CreditCard, CheckCircle2, Target } from "lucide-react";
import { LikelyrLogo } from "@/components/likelyr-logo";
import { LikelyrBackground } from "@/components/likelyr-background";
import { Avatar } from "@/components/avatar";
import { trackClientEvent } from "@/lib/analytics-client";
import { ideaPath } from "@/lib/seo";
import { PremiumDashboard } from "@/components/premium-dashboard";

const planCopy = {
  free: {
    label: "Free",
    limit: "1 idea",
    cta: "Upgrade",
  },
  launch: {
    label: "Launch Pass",
    limit: "5 ideas",
    cta: "Go Pro",
  },
  pro: {
    label: "Founder Pro",
    limit: "Unlimited ideas",
    cta: "Manage",
  },
} as const;

export default function DashboardPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingMsg, setBillingMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncingRef = useRef(false);

  const isCheckoutSuccess = searchParams.get("checkout") === "success";

  useEffect(() => {
    if (status === "unauthenticated" && !isCheckoutSuccess) {
      router.replace("/signin");
    }
  }, [router, status, isCheckoutSuccess]);

  useEffect(() => {
    if (!isCheckoutSuccess) return;
    trackClientEvent("checkout_success_landed");
  }, [isCheckoutSuccess]);

  useEffect(() => {
    const email = session?.user?.email;
    const plan = session?.user?.plan ?? "free";
    if (!email) return;
    if (plan === "pro") {
      if (isCheckoutSuccess) {
        window.history.replaceState(null, "", "/dashboard");
      }
      return;
    }

    const syncKey = `likelyr-billing-sync:v2:${email}`;
    const lastSync = Number(window.localStorage.getItem(syncKey) ?? 0);
    const shouldSync = isCheckoutSuccess || Date.now() - lastSync > 10 * 60 * 1000;
    if (!shouldSync) return;
    if (syncingRef.current) return;
    syncingRef.current = true;

    window.localStorage.setItem(syncKey, String(Date.now()));

    let cancelled = false;
    (async () => {
      try {
        await fetch("/api/billing/sync", { method: "POST" });
      } catch {}
      if (!cancelled) {
        try {
          await updateSession();
        } catch {}
      }
      syncingRef.current = false;
    })();

    return () => { cancelled = true; };
  }, [isCheckoutSuccess, session?.user?.email, session?.user?.plan, updateSession]);

  useEffect(() => {
    if (!isCheckoutSuccess) return;

    const timeouts = [2000, 5000].map((delay) =>
      window.setTimeout(() => {
        updateSession().catch(() => {});
      }, delay)
    );

    return () => {
      timeouts.forEach(window.clearTimeout);
    };
  }, [isCheckoutSuccess, updateSession]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    let cancelled = false;

    fetch(`/api/ideas?userId=${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load ideas");
        return res.json() as Promise<Idea[]>;
      })
      .then((loadedIdeas) => {
        if (!cancelled) setIdeas(loadedIdeas);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your ideas. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  if (status === "loading" || (Boolean(session?.user?.id) && loading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error && ideas.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  const totalWins = ideas.reduce((s, i) => s + i.wins, 0);
  const totalLosses = ideas.reduce((s, i) => s + i.losses, 0);
  const bestElo = ideas.length > 0 ? Math.max(...ideas.map((i) => i.elo_score)) : 1000;
  const overallWinRate = totalWins + totalLosses > 0 ? Math.round((totalWins / (totalWins + totalLosses)) * 100) : 0;
  const currentPlan = session.user.plan ?? "free";
  const plan = planCopy[currentPlan];
  const predictionWins = session.user.predictionWins ?? 0;
  const predictionLosses = session.user.predictionLosses ?? 0;
  const predictionElo = session.user.predictionElo ?? 1000;
  const predictionAccuracy = getPredictionAccuracy(predictionWins, predictionLosses);
  const predictionTier = formatPredictionTier(predictionElo);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProfileMsg(null);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("name", nameValue || session?.user?.name || "");
      const res = await fetch("/api/profile", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const { user } = await res.json();
      await updateSession({ name: user.name, image: user.image });
      setProfileMsg("Avatar updated!");
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleNameSave() {
    setUploading(true);
    setProfileMsg(null);
    try {
      const formData = new FormData();
      formData.append("name", nameValue);
      const res = await fetch("/api/profile", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to update name");
      const { user } = await res.json();
      await updateSession({ name: user.name });
      setProfileMsg("Name updated!");
      setEditingProfile(false);
    } catch {
      setProfileMsg("Failed to update name.");
    } finally {
      setUploading(false);
    }
  }

  async function openBillingPortal() {
    setBillingLoading(true);
    setBillingMsg(null);
    trackClientEvent("billing_portal_clicked", { source: "dashboard" });
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.url !== "string") {
        throw new Error(typeof data.error === "string" ? data.error : "Could not open billing portal.");
      }
      window.location.assign(data.url);
    } catch (err) {
      setBillingMsg(err instanceof Error ? err.message : "Could not open billing portal.");
      setBillingLoading(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-4xl px-6 py-10">
      <LikelyrBackground className="opacity-[0.06]" />
      <div className="relative z-10">
      {isCheckoutSuccess && currentPlan !== "pro" && (
        <div className="mb-6 flex items-center gap-3 border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 animate-slide-up">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Your payment went through. Your plan will update here as soon as Stripe confirms it.</span>
        </div>
      )}
      {isCheckoutSuccess && currentPlan === "pro" && (
        <div className="mb-6 flex items-center gap-3 border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 animate-slide-up">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Welcome to Founder Pro! Your subscription is active.</span>
        </div>
      )}

      {/* Profile Section */}
      <div className="mb-8 border border-border/30 bg-card/20 p-5">
        <div className="flex items-start gap-5">
          <div className="relative group shrink-0">
            <Avatar src={session.user.image} name={session.user.name} size={64} className="border-2 border-border/50" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="min-w-0 flex-1">
            {editingProfile ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value.slice(0, 50))}
                  className="rounded-none border border-border/50 bg-background/50 px-2 py-1 text-sm font-bold focus:border-fire/50 focus:outline-none focus:ring-1 focus:ring-fire/30"
                  maxLength={50}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                />
                <button onClick={handleNameSave} disabled={uploading} className="rounded-none btn-fire bg-fire px-2 py-1 text-xs font-bold text-fire-foreground hover:bg-fire/90">
                  <Check className="h-3 w-3" />
                </button>
                <button onClick={() => { setEditingProfile(false); setNameValue(session.user?.name || ""); }} className="rounded-none border border-border/50 px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                  cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black">{session.user?.name || "Anonymous"}</h1>
                <button onClick={() => { setNameValue(session.user?.name || ""); setEditingProfile(true); }} className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-fire transition-colors">
                  edit
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{session.user?.email}</p>
            {uploading && <p className="mt-1 text-xs text-fire">Uploading...</p>}
            {profileMsg && (
              <p className={`mt-1 text-xs ${profileMsg.includes("failed") || profileMsg.includes("Failed") ? "text-red-400" : "text-emerald-400"}`}>
                {profileMsg}
              </p>
            )}
            <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground/60">
              click avatar to change photo
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 border border-border/30 bg-card/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-fire/30 bg-fire/10 text-fire">
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">plan</p>
              <p className="text-sm font-semibold">
                {plan.label}
                <span className="mx-2 text-muted-foreground">/</span>
                <span className="text-muted-foreground">{plan.limit}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={billingLoading}
              className="inline-flex items-center justify-center gap-1.5 border border-border/50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-fire/40 hover:text-fire disabled:opacity-60"
            >
              {billingLoading ? "Opening..." : "Manage billing"}
              <ExternalLink className="h-3 w-3" />
            </button>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-1.5 border border-border/50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-fire/40 hover:text-fire"
            >
              {plan.cta}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
        {billingMsg && <p className="mt-3 text-xs text-red-400">{billingMsg}</p>}
      </div>

      <div className="mb-8 border border-border/30 bg-card/20 p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-fire/30 bg-fire/10 text-fire">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">predictor score</p>
              <p className="text-sm font-semibold">
                {predictionTier}
                <span className="mx-2 text-muted-foreground">/</span>
                <span className="text-muted-foreground">match the crowd signal to climb</span>
              </p>
            </div>
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex items-center justify-center gap-1.5 border border-border/50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-fire/40 hover:text-fire"
          >
            rankings
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-px border border-border/30 sm:grid-cols-4">
          <div className="bg-background/50 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">predictor elo</p>
            <p className="mt-1 text-2xl font-black text-fire">{predictionElo}</p>
          </div>
          <div className="bg-background/50 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">accuracy</p>
            <p className="mt-1 text-2xl font-black">{predictionAccuracy}%</p>
          </div>
          <div className="bg-background/50 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">guesses</p>
            <p className="mt-1 text-2xl font-black">
              <span className="text-emerald-400">{predictionWins}</span>
              <span className="text-muted-foreground"> / </span>
              <span className="text-red-400">{predictionLosses}</span>
            </p>
          </div>
          <div className="bg-background/50 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">streak</p>
            <p className="mt-1 text-2xl font-black">{session.user.predictionStreak ?? 0}</p>
          </div>
        </div>
      </div>

      <PremiumDashboard currentPlan={currentPlan} />

      {/* Stats */}
      <div className="mb-2 text-lg font-bold">your ideas</div>

      <div className="grid grid-cols-2 gap-px border border-border/30 sm:grid-cols-4">
        <div className="bg-card/30 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">ideas</p>
          <p className="mt-1 text-2xl font-black">{ideas.length}</p>
        </div>
        <div className="bg-card/30 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">win rate</p>
          <p className="mt-1 text-2xl font-black text-fire">{overallWinRate}%</p>
        </div>
        <div className="bg-card/30 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">best elo</p>
          <p className="mt-1 text-2xl font-black">{bestElo}</p>
        </div>
        <div className="bg-card/30 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">record</p>
          <p className="mt-1 text-2xl font-black">
            <span className="text-emerald-400">{totalWins}W</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-red-400">{totalLosses}L</span>
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold">your ideas</h2>
        <Link
          href="/submit"
          className="inline-flex items-center gap-1.5 rounded-none btn-fire bg-fire px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-fire-foreground hover:bg-fire/90"
        >
          <Plus className="h-3 w-3" />
          new idea
        </Link>
      </div>

      {ideas.length === 0 ? (
        <div className="mt-8 border border-border/30 bg-card/10 py-16 text-center">
          <LikelyrLogo className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-4 text-sm text-muted-foreground">
            no ideas yet. submit one and let the internet judge you.
          </p>
          <Link
            href="/submit"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-fire hover:underline"
          >
            submit your first idea
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="mt-3 space-y-1">
          {ideas.map((idea) => {
            const winRate = getWinRate(idea.wins, idea.losses);
            const survival = getSurvivalRating(idea.elo_score);
            const tier = formatElo(idea.elo_score);
            return (
              <Link key={idea.id} href={ideaPath(idea)} className="block">
                <div className="group flex items-center gap-4 border border-border/20 bg-card/10 px-4 py-3 transition-colors hover:bg-panel/20 hover:border-fire/20">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{idea.name}</span>
                      <span className={`${CATEGORY_COLORS[idea.category] ?? ""} rounded-full px-1.5 py-0.5 text-[10px]`}>
                        {idea.category}
                      </span>
                      <span className={`${STAGE_COLORS[idea.stage] ?? ""} rounded-full border px-1.5 py-0 text-[10px]`}>
                        {idea.stage}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{idea.pitch}</p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-4 text-xs sm:flex">
                    <div className="text-right">
                      <p className="font-bold text-fire">{idea.elo_score}</p>
                      <p className="text-[10px] text-muted-foreground">{tier}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">{winRate}%</p>
                      <p className="text-[10px] text-muted-foreground">win</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-400">{survival}%</p>
                      <p className="text-[10px] text-muted-foreground">survival</p>
                    </div>
                      <div className="text-right">
                      <p className="font-semibold">
                        <span className="text-emerald-400">{idea.wins}W</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-red-400">{idea.losses}L</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
}