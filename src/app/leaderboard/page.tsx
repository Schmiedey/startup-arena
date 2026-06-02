"use client";

import { useEffect, useState } from "react";
import { Idea, Category, CATEGORIES, Predictor } from "@/lib/types";
import { IdeaCard } from "@/components/idea-card";
import { Input } from "@/components/ui/input";
import { Flame, Loader2, Search, Trophy, Users, TrendingUp, Crown, ChevronDown, Target } from "lucide-react";
import Link from "next/link";
import { getWinRate, getSurvivalRating } from "@/lib/elo";
import { formatPredictionTier } from "@/lib/prediction";
import { ideaPath } from "@/lib/seo";
import { Avatar } from "@/components/avatar";
import { LikelyrBackground } from "@/components/likelyr-background";

type Tab = "top" | "trending" | "divisive" | "new";
type Board = "ideas" | "predictors";

export default function LeaderboardPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [tab, setTab] = useState<Tab>("top");
  const [board, setBoard] = useState<Board>("ideas");
  const [predictors, setPredictors] = useState<Predictor[]>([]);
  const [predictorsLoading, setPredictorsLoading] = useState(true);

  useEffect(() => {
    async function fetchIdeas() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "all") params.set("category", category);
        if (tab === "divisive") params.set("sort", "divisive");
        params.set("page", "1");
        params.set("limit", String(PAGE_SIZE));
        const res = await fetch(`/api/ideas?${params}`);
        const data = await res.json();
        setIdeas(data);
        setHasMore(data.length === PAGE_SIZE);
        setPage(1);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchIdeas();
  }, [category, tab]);

  useEffect(() => {
    if (board !== "predictors") return;

    let cancelled = false;
    fetch("/api/predictors?limit=50")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load predictors");
        return res.json() as Promise<Predictor[]>;
      })
      .then((data) => {
        if (!cancelled) setPredictors(data);
      })
      .catch(() => {
        if (!cancelled) setPredictors([]);
      })
      .finally(() => {
        if (!cancelled) setPredictorsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [board]);

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (tab === "divisive") params.set("sort", "divisive");
      params.set("page", String(page + 1));
      params.set("limit", String(PAGE_SIZE));
      const res = await fetch(`/api/ideas?${params}`);
      const data = await res.json();
      setIdeas(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setPage(prev => prev + 1);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }

  const sorted = (() => {
    const filtered = ideas.filter(
      (i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.pitch.toLowerCase().includes(search.toLowerCase())
    );
    if (tab === "top") return filtered.sort((a, b) => b.elo_score - a.elo_score);
    if (tab === "trending") return filtered.sort((a, b) => {
      const aWR = getWinRate(a.wins, a.losses);
      const bWR = getWinRate(b.wins, b.losses);
      const aBattles = a.wins + a.losses;
      const bBattles = b.wins + b.losses;
      const aScore = aWR * (aBattles > 0 ? 1 : 0) + (aBattles >= 3 ? 10 : 0) + a.elo_score * 0.01;
      const bScore = bWR * (bBattles > 0 ? 1 : 0) + (bBattles >= 3 ? 10 : 0) + b.elo_score * 0.01;
      return bScore - aScore;
    });
    if (tab === "divisive") {
      return filtered.sort((a, b) => {
        const aScore = a.controversy_score ?? 0;
        const bScore = b.controversy_score ?? 0;
        if (bScore !== aScore) return bScore - aScore;
        return (b.wins + b.losses) - (a.wins + a.losses);
      });
    }
    // "new" — by created_at descending
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  })();

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-8">
      <LikelyrBackground className="opacity-[0.06]" />
      <div className="relative z-10">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-fire/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-fire">
          <Trophy className="h-3 w-3" />
          Leaderboard
        </div>
        <h1 className="text-3xl font-black font-[family-name:var(--font-chakra)]">
          battle rankings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rank ideas by battle results, or compete as a predictor by matching the crowd signal.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-px border border-border/30 bg-border/30">
        {([
          { key: "ideas" as Board, label: "Idea rankings", icon: Trophy },
          { key: "predictors" as Board, label: "Predictors", icon: Target },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setBoard(key)}
            className={`flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              board === key
                ? "bg-fire text-fire-foreground"
                : "bg-background text-muted-foreground hover:bg-panel hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="mb-6 border border-border/30 bg-card/15 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Predictor Elo</span> rewards voters who consistently match the pre-vote crowd signal. Weak matchups are provisional until there are enough prior votes or rating separation.
      </div>

      {board === "predictors" ? (
        predictorsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-fire" />
          </div>
        ) : predictors.length === 0 ? (
          <div className="py-20 text-center">
            <Target className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-4 text-muted-foreground">
              No predictor scores yet.{" "}
              <Link href="/battle" className="text-fire hover:underline">
                Vote on a battle
              </Link>{" "}
              to enter the board.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {predictors.map((predictor, i) => {
              const tier = formatPredictionTier(predictor.prediction_elo);
              return (
                <div key={predictor.id} className="flex items-center gap-4 border border-border/20 bg-card/10 px-4 py-3">
                  <div className="w-8 shrink-0 text-center font-mono text-sm font-bold text-muted-foreground">
                    #{i + 1}
                  </div>
                  <Avatar src={predictor.image} name={predictor.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{predictor.name || "Anonymous"}</p>
                      <span className="rounded-full border border-fire/25 bg-fire/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fire">
                        {tier}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {predictor.prediction_wins} right / {predictor.prediction_losses} wrong · {predictor.accuracy}% accuracy
                    </p>
                  </div>
                  <div className="grid shrink-0 grid-cols-3 gap-4 text-right text-xs">
                    <div>
                      <p className="font-mono text-lg font-black text-fire">{predictor.prediction_elo}</p>
                      <p className="uppercase tracking-wider text-muted-foreground">Elo</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="font-mono text-lg font-black">{predictor.guesses}</p>
                      <p className="uppercase tracking-wider text-muted-foreground">Guesses</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="font-mono text-lg font-black text-emerald-400">{predictor.best_prediction_streak}</p>
                      <p className="uppercase tracking-wider text-muted-foreground">Best streak</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <>

      {/* Tabs */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex gap-1">
          {([
            { key: "top" as Tab, label: "Top Rated", icon: Crown },
            { key: "trending" as Tab, label: "Trending", icon: TrendingUp },
            { key: "divisive" as Tab, label: "Divisive", icon: Flame },
            { key: "new" as Tab, label: "New", icon: Trophy },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 rounded-none px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                tab === key
                  ? "bg-fire text-fire-foreground"
                  : "border border-border/40 text-muted-foreground hover:bg-panel hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
        <Link
          href="/founders"
          className="flex items-center gap-1.5 rounded-none border border-border/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-panel hover:text-foreground transition-colors"
        >
          <Users className="h-3 w-3" />
          Founders
        </Link>
      </div>

      {/* Search & filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            className="pl-10 bg-background/30 border-border/50"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory("all")}
            className={`shrink-0 rounded-none px-3 py-1.5 text-xs font-semibold transition-all ${
              category === "all"
                ? "bg-fire text-fire-foreground"
                : "border border-border/40 text-muted-foreground hover:bg-panel hover:text-foreground"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-none px-3 py-1.5 text-xs font-semibold transition-all ${
                category === cat
                  ? "bg-fire text-fire-foreground"
                  : "border border-border/40 text-muted-foreground hover:bg-panel hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-fire" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="py-20 text-center">
          <Trophy className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-4 text-muted-foreground">
            {search ? "No ideas match your search." : "No ideas yet."}{" "}
            <a href="/submit" className="text-fire hover:underline">
              Be the first to submit one
            </a>
            .
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 showcase */}
          {top3.length >= 3 && (
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {top3.map((idea, i) => {
                const winRate = getWinRate(idea.wins, idea.losses);
                const survival = getSurvivalRating(idea.elo_score);
                const medals = ["", "1st", "2nd", "3rd"];
                const medalColors = ["", "text-amber-400 border-amber-400/30 bg-amber-400/5", "text-zinc-300 border-zinc-400/30 bg-zinc-400/5", "text-orange-400 border-orange-400/30 bg-orange-400/5"];
                return (
                  <Link key={idea.id} href={ideaPath(idea)}>
                    <div className={`perspective-card group cursor-pointer`}>
                      <div className={`transition-all duration-300 hover:shadow-lg dark:hover:shadow-fire/5 border p-5 ${medalColors[i + 1] || "border-border/40"}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-black font-[family-name:var(--font-chakra)]">{medals[i + 1]}</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-fire">{idea.elo_score} elo</span>
                        </div>
                        <h3 className="text-lg font-bold truncate">{idea.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{idea.pitch}</p>
                        <div className="mt-4 flex items-center justify-between text-xs">
                          <span className="text-emerald-400 font-semibold">{winRate}% win</span>
                          <span className="text-amber-400 font-semibold">{survival}% survival</span>
                        </div>
                        {idea.user_name && (
                          <p className="mt-2 text-[10px] text-muted-foreground">by {idea.user_name}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Rest of list */}
          <div className="space-y-2">
            {(top3.length >= 3 ? rest : sorted).map((idea, i) => {
              const rank = top3.length >= 3 ? i + 4 : i + 1;
              return <IdeaCard key={idea.id} idea={idea} rank={rank} />;
            })}
          </div>

          {hasMore && !search && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 border border-border/40 px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:bg-panel hover:text-foreground transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Loading...</>
                ) : (
                  <><ChevronDown className="h-4 w-4" />Load more</>
                )}
              </button>
            </div>
          )}
        </>
      )}
        </>
      )}
      </div>
    </div>
  );
}
