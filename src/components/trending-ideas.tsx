"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Idea } from "@/lib/types";
import { getWinRate, getSurvivalRating } from "@/lib/elo";
import { RefreshCw } from "lucide-react";
import { ideaPath } from "@/lib/seo";

export function TrendingIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadIdeas = () => {
    setLoading(true);
    setError(false);
    fetch("/api/ideas")
      .then((r) => r.json())
      .then((data: Idea[]) => {
        const sorted = data
          .sort((a, b) => b.elo_score - a.elo_score)
          .slice(0, 3);
        setIdeas(sorted);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ideas")
      .then((r) => r.json())
      .then((data: Idea[]) => {
        if (cancelled) return;
        const sorted = data
          .sort((a, b) => b.elo_score - a.elo_score)
          .slice(0, 3);
        setIdeas(sorted);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-none border border-border/20 bg-card/20" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">Failed to load ideas.</p>
        <button
          onClick={loadIdeas}
          className="inline-flex items-center gap-2 rounded-none border border-border/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-panel hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (ideas.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {ideas.map((idea, i) => {
        const winRate = getWinRate(idea.wins, idea.losses);
        const survival = getSurvivalRating(idea.elo_score);
        return (
          <Link key={idea.id} href={ideaPath(idea)} className="group">
            <div className="relative h-full border border-border/30 bg-card/20 p-5 transition-all duration-300 hover:border-fire/30 hover:bg-panel/20 hover:shadow-lg dark:hover:shadow-fire/5">
              {i === 0 && (
                <div className="absolute -left-px -top-px rounded-none bg-fire/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-fire">
                  Top rated
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono tabular-nums text-muted-foreground">#{i === 0 ? "1" : i === 1 ? "2" : "3"}</span>
                <span className="text-xs font-bold text-fire">{idea.elo_score} elo</span>
              </div>
              <h3 className="font-bold truncate group-hover:text-fire transition-colors">{idea.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{idea.pitch}</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-semibold">{winRate}% win</span>
                <span className="text-amber-400 font-semibold">{survival}% survival</span>
              </div>
              {idea.user_name && (
                <p className="mt-1.5 text-xs text-muted-foreground">by {idea.user_name}</p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
