"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Crown, Flame, ArrowLeft, Sparkles } from "lucide-react";
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
  { min: 200, label: "Veteran", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { min: 100, label: "Proven", color: "text-fire", bg: "bg-fire/10" },
  { min: 50, label: "Rising", color: "text-amber-400", bg: "bg-amber-400/10" },
  { min: 10, label: "Newcomer", color: "text-blue-400", bg: "bg-blue-400/10" },
  { min: 0, label: "Fresh", color: "text-zinc-500", bg: "bg-zinc-500/10" },
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
        className="mb-6 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        ideas
      </Link>

      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-fire/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-fire">
          <Crown className="h-3 w-3" />
          Founders
        </div>
        <h1 className="text-3xl font-black font-[family-name:var(--font-chakra)]">
          founder rankings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          karma = (ideas × 10) + (battle wins × 5) + (votes cast × 1). climb the ranks.
        </p>
      </div>

      {/* Karma explanation */}
      <div className="mb-8 grid grid-cols-3 gap-3 border border-border/30 bg-card/20 p-4">
        <div className="text-center">
          <p className="text-xl font-black text-fire font-[family-name:var(--font-chakra)]">+10</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">per idea</p>
        </div>
        <div className="text-center border-x border-border/30">
          <p className="text-xl font-black text-emerald-400 font-[family-name:var(--font-chakra)]">+5</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">per win</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-amber-400 font-[family-name:var(--font-chakra)]">+1</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">per vote</p>
        </div>
      </div>

      <PaidMemberSpotlight title="Paid member spotlight" compact />

      {founders.length === 0 ? (
        <div className="py-20 text-center">
          <Flame className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-4 text-muted-foreground">No founders yet. Be the first!</p>
          <Link href="/submit" className="mt-4 inline-block text-sm text-fire hover:underline">
            submit your idea
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {founders.map((f, i) => {
            const karma = Number(f.karma);
            const tier = getKarmaTier(karma);
            const rank = i + 1;
            const winRate = Number(f.total_wins) + Number(f.total_losses) > 0
              ? Math.round((Number(f.total_wins) / (Number(f.total_wins) + Number(f.total_losses))) * 100)
              : 0;

            return (
              <Link key={f.id} href={founderPath(f)} className="block">
                <div className="group flex items-center gap-4 border border-border/20 bg-card/10 px-4 py-3 transition-colors hover:bg-panel/20 hover:border-fire/20">
                  {/* Rank */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none font-black font-[family-name:var(--font-chakra)] tabular-nums">
                    {rank <= 3 ? (
                      <span className="text-lg text-fire">{rank}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar src={f.image} name={f.name} size={36} />

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{f.name || "Anonymous"}</span>
                      {(f.plan === "launch" || f.plan === "pro") && (
                        <span className="inline-flex items-center gap-1 border border-fire/30 bg-fire/5 px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider text-fire">
                          <Sparkles className="h-2.5 w-2.5" />
                          {f.plan === "pro" ? "Pro" : "Launch"}
                        </span>
                      )}
                      <span className={`rounded-full px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider ${tier.color} ${tier.bg}`}>
                        {tier.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {f.profile_headline || `${Number(f.ideas_count)} idea${Number(f.ideas_count) !== 1 ? "s" : ""} · ${timeAgo(f.created_at)}`}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden shrink-0 items-center gap-4 text-xs sm:flex">
                    <div className="text-right">
                      <p className="font-black text-fire font-[family-name:var(--font-chakra)]">{karma}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">karma</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        <span className="text-emerald-400">{Number(f.total_wins)}W</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-red-400">{Number(f.total_losses)}L</span>
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{winRate}%</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{Number(f.votes_cast)}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">votes</p>
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
