"use client";

import { useEffect, useState } from "react";

interface Stats {
  ideas: number;
  votes: number;
  battles: number;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function HomeStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data: Stats) => setStats(data))
      .catch(() => {});
  }, []);

  if (!stats || (stats.ideas === 0 && stats.votes === 0 && stats.battles === 0)) return null;

  return (
    <div className="mt-10 flex items-center gap-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold tabular-nums text-foreground">{formatNumber(stats.ideas)}</span>
          <span className="text-xs uppercase tracking-wider">ideas</span>
        </div>
        <div className="h-4 w-px bg-border/40" />
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold tabular-nums text-foreground">{formatNumber(stats.votes)}</span>
          <span className="text-xs uppercase tracking-wider">votes</span>
        </div>
        <div className="h-4 w-px bg-border/40" />
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold tabular-nums text-foreground">{formatNumber(stats.battles)}</span>
          <span className="text-xs uppercase tracking-wider">battles</span>
        </div>
      </div>
    </div>
  );
}