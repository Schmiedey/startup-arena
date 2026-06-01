"use client";

import { useEffect, useRef, useState } from "react";

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

function useCountUp(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (target === 0 || started.current) return;
    started.current = true;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

function StatItem({ value, label, delay }: { value: number; label: string; delay: number }) {
  const counted = useCountUp(value, 1400);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`flex items-center gap-2 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
    >
      <span className="font-mono font-bold tabular-nums text-foreground text-lg">{formatNumber(counted)}</span>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
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
    <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2">
      <StatItem value={stats.ideas} label="ideas" delay={400} />
      <div className="hidden sm:block h-4 w-px bg-border/40" />
      <StatItem value={stats.votes} label="votes" delay={550} />
      <div className="hidden sm:block h-4 w-px bg-border/40" />
      <StatItem value={stats.battles} label="battles" delay={700} />
    </div>
  );
}