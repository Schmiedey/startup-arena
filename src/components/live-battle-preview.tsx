"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Idea } from "@/lib/types";
import { getWinRate, getSurvivalRating } from "@/lib/elo";

interface BattlePreview {
  idea_a: Idea;
  idea_b: Idea;
  battle_id: string | null;
}

export function LiveBattlePreview() {
  const [battle, setBattle] = useState<BattlePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function loadBattle() {
    setLoading(true);
    setError(false);
    fetch("/api/battle")
      .then((r) => r.json())
      .then((data: BattlePreview) => {
        if (data.idea_a && data.idea_b) {
          setBattle(data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/battle")
      .then((r) => r.json())
      .then((data: BattlePreview) => {
        if (cancelled) return;
        if (data.idea_a && data.idea_b) {
          setBattle(data);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-fire" />
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground mb-4">No battles available yet.</p>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 rounded-none bg-fire px-5 py-3 text-sm font-bold uppercase tracking-wider text-fire-foreground hover:bg-fire/90"
        >
          Be the first to submit
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const { idea_a, idea_b } = battle;
  const winRateA = getWinRate(idea_a.wins, idea_a.losses);
  const winRateB = getWinRate(idea_b.wins, idea_b.losses);
  const survivalA = getSurvivalRating(idea_a.elo_score);
  const survivalB = getSurvivalRating(idea_b.elo_score);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <IdeaPreviewCard
          idea={idea_a}
          winRate={winRateA}
          survival={survivalA}
          side="left"
        />
        <div className="flex items-center justify-center sm:shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-fire/30 bg-fire/5">
            <span className="text-lg font-black text-fire">VS</span>
          </div>
        </div>
        <IdeaPreviewCard
          idea={idea_b}
          winRate={winRateB}
          survival={survivalB}
          side="right"
        />
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/battle"
          className="group inline-flex items-center gap-2.5 rounded-none bg-fire px-6 py-3 text-sm font-bold uppercase tracking-wider text-fire-foreground shadow-[0_0_30px_rgba(220,60,30,0.25)] transition-all hover:shadow-[0_0_45px_rgba(220,60,30,0.38)] hover:scale-[1.03] active:scale-[0.98]"
        >
          vote on this matchup
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
        <button
          onClick={loadBattle}
          className="inline-flex items-center gap-2 rounded-none border border-border/40 px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-panel hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Show another
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Sign up to cast your vote and track your predictor score.
      </p>
    </div>
  );
}

function IdeaPreviewCard({
  idea,
  winRate,
  survival,
  side,
}: {
  idea: Idea;
  winRate: number;
  survival: number;
  side: "left" | "right";
}) {
  return (
    <div
      className={`flex-1 border border-border/30 bg-card/20 p-5 transition-all duration-300 hover:border-fire/20 hover:bg-panel/10 ${
        side === "left" ? "sm:animate-slide-in-left" : "sm:animate-slide-in-right"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-fire">{idea.category}</span>
        <span className="text-xs font-mono tabular-nums text-muted-foreground">{idea.elo_score} elo</span>
      </div>
      <h3 className="text-lg font-black font-[family-name:var(--font-chakra)]">{idea.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{idea.pitch}</p>
      {idea.target_customer && (
        <p className="mt-2 text-xs text-muted-foreground/70">
          For: <span className="text-foreground/80">{idea.target_customer}</span>
        </p>
      )}
      <div className="mt-4 flex items-center gap-4 text-xs">
        <span className="text-emerald-400 font-semibold">{winRate}% win</span>
        <span className="text-amber-400 font-semibold">{survival}% survival</span>
      </div>
      {idea.user_name && (
        <p className="mt-2 text-xs text-muted-foreground">by {idea.user_name}</p>
      )}
    </div>
  );
}
