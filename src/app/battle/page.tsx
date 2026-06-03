"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BattleCard } from "@/components/battle-card";
import { CommentSection } from "@/components/comment-section";
import { CATEGORIES, Idea, Comment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, MessageSquare, Share2 } from "lucide-react";
import { LikelyrLogo } from "@/components/likelyr-logo";
import { LikelyrBackground } from "@/components/likelyr-background";
import { BattleResultCard } from "@/components/battle-result-card";
import { trackClientEvent } from "@/lib/analytics-client";
import { battlePath } from "@/lib/seo";
import { PaidMemberSpotlight } from "@/components/paid-member-spotlight";

interface BattleData {
  idea_a: Idea;
  idea_b: Idea;
  battle_id: string | null;
}

interface VoteResult {
  winnerDelta: number;
  loserDelta: number;
  prediction?: {
    correct: boolean | null;
    ranked: boolean;
    eloBefore: number;
    eloAfter: number;
    eloDelta: number;
    streak: number;
  };
}

function fetchComments(ideaId: string): Promise<Comment[]> {
  return fetch(`/api/comments?idea_id=${ideaId}`)
    .then((r) => r.json())
    .catch(() => []);
}

async function fetchBattleData(options?: { category?: string | null; challenge?: string | null }): Promise<{
  battle: BattleData;
  commentsA: Comment[];
  commentsB: Comment[];
}> {
  const params = new URLSearchParams();
  if (options?.category) params.set("category", options.category);
  if (options?.challenge) params.set("challenge", options.challenge);
  const res = await fetch(`/api/battle${params.size ? `?${params}` : ""}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "Failed to load battle");
  }

  const battle = await res.json() as BattleData;
  const [loadedCommentsA, loadedCommentsB] = await Promise.all([
    battle.idea_a?.id ? fetchComments(battle.idea_a.id) : Promise.resolve([]),
    battle.idea_b?.id ? fetchComments(battle.idea_b.id) : Promise.resolve([]),
  ]);

  return { battle, commentsA: loadedCommentsA, commentsB: loadedCommentsB };
}

export default function BattlePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const challenge = searchParams.get("challenge");
  const [battle, setBattle] = useState<BattleData | null>(null);
  const [voted, setVoted] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [loser, setLoser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentsA, setCommentsA] = useState<Comment[]>([]);
  const [commentsB, setCommentsB] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [shared, setShared] = useState(false);
  const [result, setResult] = useState<VoteResult | null>(null);

  const loadBattle = useCallback(async () => {
    setLoading(true);
    setVoted(false);
    setWinner(null);
    setLoser(null);
    setError(null);
    setShowComments(false);
    setResult(null);
    try {
      const data = await fetchBattleData({ category, challenge });
      setBattle(data.battle);
      setCommentsA(data.commentsA);
      setCommentsB(data.commentsB);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load battle. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [category, challenge]);

  useEffect(() => {
    let cancelled = false;

    fetchBattleData({ category, challenge })
      .then((data) => {
        if (cancelled) return;
        setBattle(data.battle);
        setCommentsA(data.commentsA);
        setCommentsB(data.commentsB);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load battle. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, challenge]);

  async function handleVote(ideaId: string) {
    if (!battle || voted || voting) return;

    if (!session?.user) {
      trackClientEvent("vote_auth_required", { battle_id: battle.battle_id });
      router.push("/signin");
      return;
    }

    setVoting(true);
    setError(null);
    const winnerId = ideaId;
    const loserId = ideaId === battle.idea_a.id ? battle.idea_b.id : battle.idea_a.id;
    const winnerBefore = winnerId === battle.idea_a.id ? battle.idea_a : battle.idea_b;
    const loserBefore = loserId === battle.idea_a.id ? battle.idea_a : battle.idea_b;

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battle_id: battle.battle_id,
          winner_id: winnerId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError("You already voted on this battle. Loading next...");
          setTimeout(loadBattle, 1500);
          return;
        }
        if (res.status === 403) {
          setError(data.error || "You can't vote on your own idea.");
          return;
        }
        setError(data.error || "Vote failed. Please try again.");
        return;
      }

      setVoted(true);
      setWinner(winnerId);
      setLoser(loserId);
      setResult({
        winnerDelta: Number(data.newWinnerRating) - winnerBefore.elo_score,
        loserDelta: Number(data.newLoserRating) - loserBefore.elo_score,
        prediction: data.prediction,
      });
      trackClientEvent("vote_completed", {
        battle_id: battle.battle_id,
        winner_id: winnerId,
      });
    } catch {
      setError("Could not save your vote. Please try again.");
    } finally {
      setVoting(false);
    }
  }

  async function shareBattleResult() {
    if (!battle?.battle_id || !winnerIdea) return;
    const loserIdea = loser === battle.idea_a.id ? battle.idea_a : battle.idea_b;
    if (!loserIdea) return;

    const url = `${window.location.origin}${battlePath({ id: battle.battle_id, idea_a: battle.idea_a, idea_b: battle.idea_b })}`;
    const text = `${winnerIdea.name} beat ${loserIdea.name} on Likelyr. Think the crowd got it wrong?`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Likelyr result", text, url });
        trackClientEvent("battle_shared", { method: "native", battle_id: battle.battle_id });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        trackClientEvent("battle_shared", { method: "clipboard", battle_id: battle.battle_id });
      }
    } catch {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
      trackClientEvent("battle_shared", { method: "fallback", battle_id: battle.battle_id });
    }
  }

  async function handleReasonSubmit(reason: string) {
    if (!battle?.battle_id) return;
    try {
      await fetch("/api/vote", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battle_id: battle.battle_id, reason }),
      });
      trackClientEvent("vote_reason_submitted", { battle_id: battle.battle_id });
    } catch {}
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-fire/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-fire">
            <LikelyrLogo className="h-3 w-3" />
            Battle
          </div>
          <div className="mx-auto h-8 w-48 animate-pulse rounded bg-card/40" />
        </div>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {[80, 60, 60, 60].map((pw, i) => (
            <div key={i} className="shrink-0 h-7 animate-pulse rounded-none bg-card/40" style={{ width: pw }} />
          ))}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex-1 h-72 animate-pulse rounded-none border border-border/20 bg-card/20" />
          <div className="hidden sm:flex sm:items-center sm:pt-24">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-fire/20 bg-fire/5">
              <span className="text-lg font-black text-fire/30">VS</span>
            </div>
          </div>
          <div className="flex-1 h-72 animate-pulse rounded-none border border-border/20 bg-card/20" />
        </div>
      </div>
    );
  }

  if (error && !battle) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="mb-4 text-muted-foreground">{error}</p>
        <Button onClick={loadBattle} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <LikelyrLogo className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
        <h2 className="mb-2 text-2xl font-bold">Not enough ideas yet</h2>
        <p className="mb-8 text-muted-foreground">
          We need at least 2 ideas to start a battle. Be the first to submit!
        </p>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 rounded-none btn-fire bg-fire px-6 py-3 font-bold text-fire-foreground hover:bg-fire/90"
        >
          Submit Your Idea
        </Link>
      </div>
    );
  }

  const winnerIdea = winner === battle.idea_a.id ? battle.idea_a : winner === battle.idea_b.id ? battle.idea_b : null;
  const loserIdea = loser === battle.idea_a.id ? battle.idea_a : loser === battle.idea_b.id ? battle.idea_b : null;

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <LikelyrBackground className="opacity-[0.08]" />
      <div className="relative z-10">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-fire/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-fire">
            <LikelyrLogo className="h-3 w-3" />
            {challenge ? "Challenge" : category ? `${category} battle` : "Battle"}
          </div>
          <h1 className="text-2xl font-black sm:text-3xl">
            {challenge ? "Is this idea likelier to succeed?" : "Which idea is more likely to"}{" "}
            <span className="text-gradient-fire">make money</span>?
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            Pick the idea you think matches the crowd signal. Ranked predictor Elo only moves when the matchup has enough prior signal.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Ratings stay hidden until after you vote.
          </p>
        </div>

      {!challenge && (
        <div className="mb-6 relative">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Link
              href="/battle"
              className={`shrink-0 border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                !category ? "border-fire/40 bg-fire/10 text-fire" : "border-border/40 text-muted-foreground hover:border-fire/30 hover:text-fire"
              }`}
            >
              All
            </Link>
            {CATEGORIES.map((cat) => {
              const hasPro = session?.user?.plan === "pro";
              return (
                <Link
                  key={cat}
                  href={hasPro ? `/battle?category=${encodeURIComponent(cat)}` : "/pricing"}
                  onClick={() => {
                    if (!hasPro) trackClientEvent("category_battle_upgrade_clicked", { category: cat });
                  }}
                  className={`shrink-0 border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                    category === cat ? "border-fire/40 bg-fire/10 text-fire" : "border-border/40 text-muted-foreground hover:border-fire/30 hover:text-fire"
                  }`}
                  title={hasPro ? `${cat} battles` : "Founder Pro unlocks category battle testing"}
                >
                  {cat}
                  {!hasPro && <span className="ml-1 text-[9px] text-fire">PRO</span>}
                </Link>
              );
            })}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-none border border-fire/30 bg-fire/5 px-4 py-2 text-center text-sm text-fire">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1 animate-slide-in-left">
          <BattleCard
            idea={battle.idea_a}
            onVote={handleVote}
            voted={voted}
            isWinner={winner === battle.idea_a.id}
            isLoser={loser === battle.idea_a.id}
          />
        </div>
        <div className="hidden sm:flex sm:items-center sm:pt-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-fire/30 bg-fire/5 animate-vs-pulse">
            <span className="text-xl font-black text-fire">VS</span>
          </div>
        </div>
        <div className="flex items-center justify-center sm:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-fire/30 bg-fire/5 animate-vs-pulse">
            <span className="text-base font-black text-fire">VS</span>
          </div>
        </div>
        <div className="flex-1 animate-slide-in-right">
          <BattleCard
            idea={battle.idea_b}
            onVote={handleVote}
            voted={voted}
            isWinner={winner === battle.idea_b.id}
            isLoser={loser === battle.idea_b.id}
          />
        </div>
      </div>

      {voting && (
        <div className="text-center py-4">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-fire" />
          <p className="mt-2 text-sm text-muted-foreground">Recording your vote...</p>
        </div>
      )}

      {voted && winnerIdea && loserIdea && result && (
        <BattleResultCard
          winner={winnerIdea}
          loser={loserIdea}
          battleId={battle.battle_id}
          winnerDelta={result.winnerDelta}
          loserDelta={result.loserDelta}
          prediction={result.prediction}
          shared={shared}
          onShare={shareBattleResult}
          onNext={loadBattle}
          onReason={handleReasonSubmit}
        />
      )}

      {voted && (
        <div className="animate-slide-up mt-4 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={loadBattle}
              variant="outline"
              size="default"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Next Battle
            </Button>
            <Button
              variant="outline"
              size="default"
              className="gap-2"
              onClick={() => setShowComments(true)}
            >
              <MessageSquare className="h-4 w-4" />
              Discuss
            </Button>
            {battle?.battle_id && (
              <a
                href={battlePath({ id: battle.battle_id, idea_a: battle.idea_a, idea_b: battle.idea_b })}
                onClick={async (e) => {
                  e.preventDefault();
                  await shareBattleResult();
                }}
                className="inline-flex items-center gap-2 border border-border/40 px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                <Share2 className="h-4 w-4" />
                {shared ? "Copied!" : "Share"}
              </a>
            )}
          </div>
        </div>
      )}

      {(showComments || voted) && battle && (
        <div className="mt-8">
          <div className="mb-6 text-center">
            {!voted && (
              <Button
                onClick={() => setShowComments(false)}
                variant="outline"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-panel border border-border/40"
              >
                Hide Comments
              </Button>
            )}
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fire">
                {battle.idea_a.name}
              </h3>
              <CommentSection ideaId={battle.idea_a.id} comments={commentsA} />
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fire">
                {battle.idea_b.name}
              </h3>
              <CommentSection ideaId={battle.idea_b.id} comments={commentsB} />
            </div>
          </div>
        </div>
      )}

      {!voted && (
        <div className="mt-6 text-center">
          <Button
            onClick={() => {
              trackClientEvent("battle_skipped", { battle_id: battle?.battle_id });
              loadBattle();
            }}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Skip this matchup
          </Button>
        </div>
      )}

      {!challenge && (
        <PaidMemberSpotlight
          category={category}
          limit={6}
          title={category ? `${category} spotlight` : "Arena spotlight"}
          placement="bottom"
          variant="carousel"
        />
      )}
      </div>
    </div>
  );
}
