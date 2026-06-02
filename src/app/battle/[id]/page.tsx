"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { BattleCard } from "@/components/battle-card";
import { CommentSection } from "@/components/comment-section";
import { Idea, Comment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, MessageSquare, MessageCircle, Share2, ArrowLeft } from "lucide-react";
import { LikelyrLogo } from "@/components/likelyr-logo";
import { LikelyrBackground } from "@/components/likelyr-background";
import Link from "next/link";
import { BattleResultCard } from "@/components/battle-result-card";
import { extractEntityId } from "@/lib/seo";

interface BattleData {
  idea_a: Idea;
  idea_b: Idea;
  battle_id: string | null;
}

interface VoteResult {
  winnerDelta: number;
  loserDelta: number;
}

function fetchComments(ideaId: string): Promise<Comment[]> {
  return fetch(`/api/comments?idea_id=${ideaId}`)
    .then((r) => r.json())
    .catch(() => []);
}

async function fetchBattleData(id: string): Promise<{
  battle: BattleData;
  commentsA: Comment[];
  commentsB: Comment[];
}> {
  const res = await fetch(`/api/battle?id=${id}`);
  if (!res.ok) throw new Error("Battle not found");

  const battle = await res.json() as BattleData;
  const [loadedCommentsA, loadedCommentsB] = await Promise.all([
    battle.idea_a?.id ? fetchComments(battle.idea_a.id) : Promise.resolve([]),
    battle.idea_b?.id ? fetchComments(battle.idea_b.id) : Promise.resolve([]),
  ]);

  return { battle, commentsA: loadedCommentsA, commentsB: loadedCommentsB };
}

export default function SharedBattlePage() {
  const params = useParams();
  const id = extractEntityId(params.id as string);
  const { data: session } = useSession();
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
  const [reason, setReason] = useState("");
  const [reasonSubmitted, setReasonSubmitted] = useState(false);
  const [reasonSubmitting, setReasonSubmitting] = useState(false);
  const [shared, setShared] = useState(false);
  const [result, setResult] = useState<VoteResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchBattleData(id)
      .then((data) => {
        if (cancelled) return;
        setBattle(data.battle);
        setCommentsA(data.commentsA);
        setCommentsB(data.commentsB);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this battle. It may have been removed.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleVote(ideaId: string) {
    if (!battle || voted || voting) return;
    if (!session?.user) {
      window.location.href = "/signin";
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
        body: JSON.stringify({ battle_id: battle.battle_id, winner_id: winnerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setError("You already voted on this battle.");
          return;
        }
        if (res.status === 403) {
          setError(data.error || "You can't vote on your own idea.");
          return;
        }
        setError(data.error || "Vote failed.");
        return;
      }
      setVoted(true);
      setWinner(winnerId);
      setLoser(loserId);
      setResult({
        winnerDelta: Number(data.newWinnerRating) - winnerBefore.elo_score,
        loserDelta: Number(data.newLoserRating) - loserBefore.elo_score,
      });
    } catch {
      setError("Could not save your vote.");
    } finally {
      setVoting(false);
    }
  }

  async function submitReason() {
    if (!battle || !reason.trim()) return;
    setReasonSubmitting(true);
    try {
      await fetch("/api/vote", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ battle_id: battle.battle_id, reason: reason.trim() }),
      });
    } catch { /* optional */ } finally {
      setReasonSubmitted(true);
      setReasonSubmitting(false);
    }
  }

  async function handleShare() {
    const winnerIdea = winner === battle?.idea_a.id ? battle.idea_a : winner === battle?.idea_b.id ? battle.idea_b : null;
    const loserIdea = loser === battle?.idea_a.id ? battle.idea_a : loser === battle?.idea_b.id ? battle.idea_b : null;
    const text = winnerIdea && loserIdea
      ? `${winnerIdea.name} beat ${loserIdea.name} on Likelyr. Think the crowd got it wrong?`
      : "Vote on this idea battle on Likelyr.";

    if (navigator.share) {
      await navigator.share({ title: "Likelyr Battle", text, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-fire" />
          <p className="mt-3 text-sm text-muted-foreground">Loading battle...</p>
        </div>
      </div>
    );
  }

  if (error && !battle) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="mb-4 text-muted-foreground">{error}</p>
        <Link href="/battle" className="inline-flex items-center gap-2 text-sm text-fire hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Go to a new battle
        </Link>
      </div>
    );
  }

  if (!battle) return null;

  const winnerIdea = winner === battle.idea_a.id ? battle.idea_a : winner === battle.idea_b.id ? battle.idea_b : null;
  const loserIdea = loser === battle.idea_a.id ? battle.idea_a : loser === battle.idea_b.id ? battle.idea_b : null;

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <LikelyrBackground className="opacity-[0.08]" />
      <div className="relative z-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/battle" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" />
          new battle
        </Link>
        <Button onClick={handleShare} variant="outline" size="sm" className="gap-1.5 border-border/40 rounded-none">
          <Share2 className="h-3.5 w-3.5" />
          {shared ? "Copied!" : "Share"}
        </Button>
      </div>

      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-fire/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-fire">
          <LikelyrLogo className="h-3 w-3" />
          Shared Battle
        </div>
        <h1 className="text-2xl font-black sm:text-3xl">
          Which idea is more likely to{" "}
          <span className="text-gradient-fire">make money</span>?
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-none border border-fire/30 bg-fire/5 px-4 py-2 text-center text-sm text-fire">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1 animate-slide-in-left">
          <BattleCard idea={battle.idea_a} onVote={handleVote} voted={voted} isWinner={winner === battle.idea_a.id} isLoser={loser === battle.idea_a.id} />
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
          <BattleCard idea={battle.idea_b} onVote={handleVote} voted={voted} isWinner={winner === battle.idea_b.id} isLoser={loser === battle.idea_b.id} />
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
          shared={shared}
          onShare={handleShare}
        />
      )}

      {voted && !reasonSubmitted && winnerIdea && (
        <div className="animate-slide-up mt-4 rounded-none border border-border/40 bg-card/30 p-5">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-fire" />
            <div className="flex-1">
              <p className="text-sm font-bold">
                Why did you pick <span className="text-fire">{winnerIdea.name}</span>?
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Optional — share your reasoning.</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                placeholder="e.g. clearer target market, simpler revenue model..."
                rows={2}
                className="mt-3 w-full resize-none rounded-none border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:border-fire/50 focus:outline-none focus:ring-1 focus:ring-fire/30"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground/60">{reason.length}/500</p>
                <div className="flex gap-2">
                  <button onClick={() => setReasonSubmitted(true)} className="rounded-none px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Skip</button>
                  <button onClick={submitReason} disabled={!reason.trim() || reasonSubmitting} className="rounded-none bg-fire px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-fire-foreground hover:bg-fire/90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
                    {reasonSubmitting ? "Saving..." : "Share reason"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {voted && reasonSubmitted && reason.trim() && (
        <div className="animate-slide-up mt-4 rounded-none border border-fire/20 bg-fire/5 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            <span className="text-fire font-semibold">Your reason:</span> {reason.trim()}
          </p>
        </div>
      )}

      {voted && (
        <div className="animate-slide-up mt-4 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Link href="/battle">
              <Button variant="outline" size="default" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Next Battle
              </Button>
            </Link>
            <Button variant="outline" size="default" className="gap-2" onClick={() => setShowComments(true)}>
              <MessageSquare className="h-4 w-4" />
              Discuss
            </Button>
          </div>
        </div>
      )}

      {showComments && battle && (
        <div className="mt-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fire">{battle.idea_a.name}</h3>
              <CommentSection ideaId={battle.idea_a.id} comments={commentsA} />
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fire">{battle.idea_b.name}</h3>
              <CommentSection ideaId={battle.idea_b.id} comments={commentsB} />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
