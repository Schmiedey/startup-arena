"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Crown, Flame, ArrowLeft, Sparkles, Swords, TrendingUp, Zap } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { founderPath } from "@/lib/seo";
import { PaidMemberSpotlight } from "@/components/paid-member-spotlight";

interface Founder {
  id: string;
  name: string | null;
  image: string | null;
  is_bot?: boolean;
  plan?: "free" | "launch" | "pro";
  profile_headline?: string | null;
  created_at: string;
  ideas_count: string;
  total_wins: string;
  total_losses: string;
  best_elo: string;
  votes_cast: string;
  karma: string;
}

const KARMA_TIERS = [
  { min: 200, label: "Veteran", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", ring: "ring-emerald-400/25" },
  { min: 100, label: "Proven", color: "text-fire", bg: "bg-fire/10", border: "border-fire/20", ring: "ring-fire/25" },
  { min: 50, label: "Rising", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", ring: "ring-amber-400/25" },
  { min: 10, label: "Newcomer", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", ring: "ring-blue-400/25" },
  { min: 0, label: "Fresh", color: "text-zinc-500", bg: "bg-zinc-500/10", border: "border-zinc-500/20", ring: "ring-zinc-500/25" },
];

function getKarmaTier(karma: number) {
  return KARMA_TIERS.find((t) => karma >= t.min) ?? KARMA_TIERS[KARMA_TIERS.length - 1];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function FoundersPage() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/founders")
      .then((r) => r.json())
      .then(setFounders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/leaderboard"
        className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        leaderboard
      </Link>

      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-fire/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-fire ring-1 ring-fire/20">
          <Flame className="h-3 w-3" />
          Founder rankings
        </div>
        <h1 className="text-4xl font-black font-[family-name:var(--font-chakra)]">
          who&apos;s building
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-lg mx-auto">
          climb the ranks by submitting ideas, winning battles, and voting on matchups.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-3 gap-4">
        <div className="group relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-card/60 to-panel/20 p-5 transition-all hover:border-fire/20 hover:shadow-[0_0_30px_rgba(220,60,30,0.06)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fire/40 to-transparent" />
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fire/10 text-fire">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Per idea</span>
          </div>
          <p className="text-2xl font-black text-fire font-[family-name:var(--font-chakra)]">+10</p>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-card/60 to-emerald-950/10 p-5 transition-all hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.06)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Swords className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Per win</span>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-[family-name:var(--font-chakra)]">+5</p>
        </div>
        <div className="group relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-card/60 to-amber-950/10 p-5 transition-all hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.06)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Per vote</span>
          </div>
          <p className="text-2xl font-black text-amber-400 font-[family-name:var(--font-chakra)]">+1</p>
        </div>
      </div>

      <PaidMemberSpotlight />

      {founders.length === 0 ? (
        <div className="py-20 text-center">
          <Flame className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-4 text-muted-foreground">No founders yet. Be the first!</p>
          <Link href="/submit" className="mt-4 inline-block text-sm text-fire hover:underline">
            submit your idea
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {founders.map((f, i) => {
            const karma = Number(f.karma);
            const tier = getKarmaTier(karma);
            const rank = i + 1;
            const wins = Number(f.total_wins);
            const losses = Number(f.total_losses);
            const totalBattles = wins + losses;
            const isPro = f.plan === "pro";
            const isLaunch = f.plan === "launch";
            const isPaid = isPro || isLaunch;

            return (
              <Link key={f.id} href={founderPath(f)} className="block group">
                <div className="relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-card/50 via-card/30 to-panel/10 p-4 transition-all duration-300 hover:border-fire/20 hover:shadow-[0_0_30px_rgba(220,60,30,0.06)]">
                  {rank <= 3 && (
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fire/50 to-transparent" />
                  )}
                  <div className="flex items-center gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black font-[family-name:var(--font-chakra)] tabular-nums ${
                      rank === 1 ? "bg-fire/15 text-fire ring-1 ring-fire/30" 
                      : rank === 2 ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-400/20"
                      : rank === 3 ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-400/20"
                      : "bg-card/60 text-muted-foreground"
                    }`}>
                      {rank <= 3 ? (
                        <Crown className={rank === 1 ? "h-4 w-4" : "h-3.5 w-3.5"} />
                      ) : (
                        <span className="text-sm">{rank}</span>
                      )}
                    </div>

                    <Avatar src={f.image} name={f.name} size={40} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold truncate group-hover:text-fire transition-colors">
                          {f.name || "Anonymous"}
                        </span>
                        {isPaid && (
                          <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider ${
                            isPro ? "bg-fire/10 text-fire ring-1 ring-fire/20" : "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                          }`}>
                            {isPro ? <Sparkles className="h-2.5 w-2.5" /> : <Crown className="h-2.5 w-2.5" />}
                            {isPro ? "Pro" : "Launch"}
                          </span>
                        )}
                        <span className={`rounded-full px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider ${tier.color} ${tier.bg} ring-1 ${tier.border}`}>
                          {tier.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {f.profile_headline || `${Number(f.ideas_count)} idea${Number(f.ideas_count) !== 1 ? "s" : ""} · ${timeAgo(f.created_at)}`}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-3">
                      <div className="flex items-center gap-1.5 rounded-full bg-panel/60 px-3 py-1.5">
                        <Zap className="h-3 w-3 text-fire" />
                        <span className="font-black text-fire font-[family-name:var(--font-chakra)] tabular-nums">{karma}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">karma</span>
                      </div>
                      {totalBattles > 0 && (
                        <div className="flex items-center gap-1.5 rounded-full bg-panel/60 px-3 py-1.5">
                          <Swords className="h-3 w-3 text-amber-400" />
                          <span className="font-bold tabular-nums text-emerald-400">{wins}W</span>
                          <span className="text-muted-foreground/40">/</span>
                          <span className="font-bold tabular-nums text-red-400">{losses}L</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 rounded-full bg-panel/60 px-3 py-1.5">
                        <span className="font-bold tabular-nums">{Number(f.votes_cast)}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">votes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}