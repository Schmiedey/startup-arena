"use client";

import { useEffect, useState } from "react";
import { Idea, Comment, CATEGORY_COLORS, STAGE_COLORS } from "@/lib/types";
import { CommentSection } from "@/components/comment-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getWinRate, getSurvivalRating, formatElo } from "@/lib/elo";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Share2, TrendingUp, Zap, Target, Loader2, MessageCircle, Pencil, Trash2, Swords } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { trackClientEvent } from "@/lib/analytics-client";

interface VoteReason {
  reason: string;
  created_at: string;
  name: string | null;
  image: string | null;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function IdeaPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;
  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reasons, setReasons] = useState<VoteReason[]>([]);
  const [shared, setShared] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwner = session?.user?.id && idea?.user_id
    ? session.user.id === idea.user_id
    : false;
  const isAdmin = session?.user?.isAdmin === true;

  async function handleDelete() {
    if (!confirm("Delete this idea permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ideas?ideaId=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      trackClientEvent("idea_deleted", { idea_id: id });
      router.push("/dashboard");
    } catch {
      alert("Failed to delete. Try again.");
      setDeleting(false);
    }
  }

  useEffect(() => {
    async function fetchIdea() {
      setLoading(true);
      try {
        const res = await fetch(`/api/ideas?id=${id}`);
        const ideas = await res.json();
        if (ideas.length > 0) setIdea(ideas[0]);
        else setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    async function fetchComments() {
      try {
        const res = await fetch(`/api/comments?idea_id=${id}`);
        setComments(await res.json());
      } catch {}
    }
    async function fetchReasons() {
      try {
        const res = await fetch(`/api/reasons?idea_id=${id}`);
        if (res.ok) setReasons(await res.json());
      } catch {}
    }
    fetchIdea();
    fetchComments();
    fetchReasons();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  if (notFound || !idea) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-black">Idea not found</h1>
        <p className="mt-2 text-muted-foreground">This idea doesn&apos;t exist or has been removed.</p>
        <Link href="/leaderboard" className="mt-4 inline-block text-sm text-fire hover:underline">
          back to leaderboard
        </Link>
      </div>
    );
  }

  const winRate = getWinRate(idea.wins, idea.losses);
  const survival = getSurvivalRating(idea.elo_score);
  const eloTier = formatElo(idea.elo_score);
  const totalBattles = idea.wins + idea.losses;

  async function handleShare() {
    if (!idea) return;
    const text = `"${idea.name}" has a ${survival}% survival rating on Likelyr. Think it can survive?`;
    if (navigator.share) {
      await navigator.share({ title: `${idea.name} — Likelyr`, text, url: window.location.href });
      trackClientEvent("idea_shared", { idea_id: idea.id, method: "native" });
    } else {
      await navigator.clipboard.writeText(`${text}\n\n${window.location.href}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
      trackClientEvent("idea_shared", { idea_id: idea.id, method: "clipboard" });
    }
  }

  async function handleChallengeShare() {
    if (!idea) return;
    const challengeUrl = `${window.location.origin}/battle?challenge=${idea.id}`;
    const text = `Think "${idea.name}" is less likely to succeed? Challenge it on Likelyr.`;

    if (navigator.share) {
      await navigator.share({ title: `Challenge ${idea.name}`, text, url: challengeUrl });
      trackClientEvent("challenge_share_clicked", { idea_id: idea.id, method: "native" });
    } else {
      await navigator.clipboard.writeText(`${text}\n\n${challengeUrl}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
      trackClientEvent("challenge_share_clicked", { idea_id: idea.id, method: "clipboard" });
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/leaderboard"
        className="mb-6 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        leaderboard
      </Link>

      <Card className="border-border/30 bg-card/20">
        <CardContent className="p-6 sm:p-8 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-black sm:text-3xl">{idea.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{idea.pitch}</p>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  <Link href={`/idea/${id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-1.5 border-border/40 rounded-none">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-none">
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleting ? "..." : "Delete"}
                  </Button>
                </>
              )}
              {isAdmin && !isOwner && (
                <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-none">
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting ? "..." : "Delete"}
                </Button>
              )}
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 border-border/40 rounded-none"
              >
                <Share2 className="h-3.5 w-3.5" />
                {shared ? "Copied!" : "Share"}
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Link
              href={`/battle?challenge=${idea.id}`}
              className="inline-flex items-center justify-center gap-2 bg-fire px-4 py-3 text-xs font-bold uppercase tracking-wider text-fire-foreground transition-colors hover:bg-fire/90"
            >
              <Swords className="h-3.5 w-3.5" />
              Challenge this idea
            </Link>
            <button
              onClick={handleChallengeShare}
              className="inline-flex items-center justify-center gap-2 border border-fire/30 px-4 py-3 text-xs font-bold uppercase tracking-wider text-fire transition-colors hover:bg-fire/10"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share challenge
            </button>
            <a
              href="#roast"
              className="inline-flex items-center justify-center gap-2 border border-border/40 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-fire/30 hover:text-fire"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Roast / advise
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={STAGE_COLORS[idea.stage] ?? ""}>{idea.stage}</Badge>
            <Badge variant="secondary" className={`${CATEGORY_COLORS[idea.category] ?? ""} text-xs`}>{idea.category}</Badge>
            {idea.user_name && (
              <Link href={`/founder/${idea.user_id}`} className="text-xs text-muted-foreground hover:text-fire transition-colors">
                by {idea.user_name}
              </Link>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="border border-fire/10 bg-fire/5 p-3 text-center">
              <p className="text-2xl font-black text-fire">{idea.elo_score}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Elo</p>
              <p className="text-[10px] text-fire/50">{eloTier}</p>
            </div>
            <div className="border border-emerald-500/10 bg-emerald-500/5 p-3 text-center">
              <p className="text-2xl font-black text-emerald-400">{winRate}%</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Win Rate</p>
              <p className="text-[10px] text-emerald-400/50">{idea.wins}W / {idea.losses}L</p>
            </div>
            <div className="border border-amber-500/10 bg-amber-500/5 p-3 text-center">
              <p className="text-2xl font-black text-amber-400">{survival}%</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Survival</p>
              <p className="text-[10px] text-amber-400/50">{totalBattles} battles</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2 bg-background/20 p-3">
              <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Target Customer</p>
                <p className="text-sm">{idea.target_customer}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-background/20 p-3">
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Revenue Model</p>
                <p className="text-sm">{idea.revenue_model}</p>
              </div>
            </div>
          </div>

          <div className="bg-background/20 p-3">
            <TrendingUp className="mb-1 h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Problem</p>
            <p className="text-sm">{idea.problem}</p>
          </div>

          <div className="border border-fire/15 bg-fire/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              &quot;{idea.name}&quot; has a <span className="font-bold text-fire">{survival}% survival rating</span>.
              {winRate >= 50 ? ` Winning ${winRate}% of its battles.` : " Think it can do better?"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vote reasons */}
      {reasons.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-fire" />
            <h2 className="text-lg font-bold">Why voters picked this idea</h2>
            <span className="rounded-full bg-fire/10 px-2 py-0.5 text-xs font-semibold text-fire">{reasons.length}</span>
          </div>
          <div className="space-y-3">
            {reasons.map((r, i) => (
              <div key={i} className="rounded-none border border-border/30 bg-card/20 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Avatar src={r.image} name={r.name} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold">{r.name || "Anonymous"}</span>
                      <span className="text-[10px] text-muted-foreground/60">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{r.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div id="roast" className="mt-8 scroll-mt-20">
        <div className="mb-4">
          <h2 className="text-lg font-bold">Roast / advise this idea</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Useful criticism travels farther than a vote. Tell the founder what would make this win.
          </p>
        </div>
        <CommentSection ideaId={idea.id} comments={comments} />
      </div>
    </div>
  );
}
