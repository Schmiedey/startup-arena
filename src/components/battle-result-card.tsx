"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Crown, Share2, Sparkles, Swords, Trophy, MessageCircle, Target, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Idea } from "@/lib/types";
import { battlePath } from "@/lib/seo";
import { trackClientEvent } from "@/lib/analytics-client";
import { useDismissiblePrompt } from "@/lib/use-dismissible-prompt";

interface BattleResultCardProps {
  winner: Idea;
  loser: Idea;
  ideaA?: Idea;
  ideaB?: Idea;
  battleId: string | null;
  winnerDelta: number;
  loserDelta: number;
  ideaADelta?: number;
  ideaBDelta?: number;
  prediction?: {
    correct: boolean | null;
    ranked: boolean;
    eloBefore: number;
    eloAfter: number;
    eloDelta: number;
    streak: number;
    community?: {
      ideaAId: string;
      ideaBId: string;
      ideaAVotes: number;
      ideaBVotes: number;
      totalVotes: number;
      leaderId: string | null;
      targetIdBeforeVote: string | null;
    };
  };
  shared: boolean;
  onShare: () => void;
  onNext?: () => void;
  onReason?: (reason: string) => Promise<void>;
  viewerPlan?: "free" | "launch" | "pro";
  viewerKey?: string;
}

function ResultUpgradePrompt({ viewerPlan = "free", viewerKey = "guest" }: { viewerPlan?: "free" | "launch" | "pro"; viewerKey?: string }) {
  const prompt = useDismissiblePrompt(`likelyr-upgrade-prompt:v1:result:${viewerPlan}:${viewerKey}`);
  const isLaunch = viewerPlan === "launch";
  const href = isLaunch ? "/pricing" : "/pricing?checkout=launch-pass";
  const eventPlan = isLaunch ? "founder-pro-monthly" : "launch-pass";
  const points = isLaunch
    ? ["Category battles", "Priority placement", "Private analytics"]
    : ["5 idea slots", "Spotlight rotation", "Lead capture"];

  if (viewerPlan === "pro" || !prompt.visible) return null;

  return (
    <div className="relative border-t border-border/35 bg-card/30 px-5 py-4">
      <button
        type="button"
        onClick={() => {
          prompt.dismiss();
          trackClientEvent("battle_upgrade_dismissed", {
            cooldown_days: prompt.cooldownDays,
            placement: "result",
            plan: eventPlan,
          });
        }}
        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={`Hide subscription suggestion for ${prompt.cooldownDays} days`}
        title={`Hide for ${prompt.cooldownDays} days`}
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col gap-3 pr-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-fire">
            {isLaunch ? <Sparkles className="h-3 w-3" /> : <Crown className="h-3 w-3" />}
            {isLaunch ? "Founder Pro" : "Launch Pass"}
          </div>
          <p className="text-sm font-bold leading-snug">
            {isLaunch ? "Want this signal by category?" : "Want voters judging your idea next?"}
          </p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            {isLaunch
              ? "Pro adds targeted battles, priority placement, and private analytics for founder decisions."
              : "Launch Pass adds idea slots, spotlight rotation, lead capture, and direct challenge links."}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {points.map((point) => (
              <span key={point} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-fire" />
                {point}
              </span>
            ))}
          </div>
        </div>
        <Link
          href={href}
          onClick={() => trackClientEvent("battle_result_upgrade_clicked", { plan: eventPlan })}
          className={`inline-flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            isLaunch
              ? "border border-fire/45 text-fire hover:bg-fire/10"
              : "bg-fire text-fire-foreground hover:bg-fire/90"
          }`}
        >
          {isLaunch ? "Upgrade to Pro" : "Get Launch Pass"}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function BattleResultCard({
  winner,
  loser,
  ideaA,
  ideaB,
  battleId,
  winnerDelta,
  loserDelta,
  ideaADelta,
  ideaBDelta,
  prediction,
  shared,
  onShare,
  onNext,
  onReason,
  viewerPlan = "free",
  viewerKey = "guest",
}: BattleResultCardProps) {
  const [reason, setReason] = useState("");
  const [reasonSubmitted, setReasonSubmitted] = useState(false);
  const [reasonSubmitting, setReasonSubmitting] = useState(false);
  const community = prediction?.community;
  const sideA = ideaA ?? winner;
  const sideB = ideaB ?? loser;
  const orderedSides = [sideA, sideB].map((idea) => {
    const explicitDelta = ideaA?.id === idea.id
      ? ideaADelta
      : ideaB?.id === idea.id
        ? ideaBDelta
        : undefined;
    const delta = explicitDelta ?? (idea.id === winner.id ? winnerDelta : loserDelta);
    const communityVotes = community
      ? idea.id === community.ideaAId
        ? community.ideaAVotes
        : idea.id === community.ideaBId
          ? community.ideaBVotes
          : null
      : null;
    const communityShare = community && communityVotes !== null && community.totalVotes > 0
      ? Math.round((communityVotes / community.totalVotes) * 100)
      : null;

    return {
      idea,
      delta,
      isWinner: idea.id === winner.id,
      isCommunityLeader: community?.leaderId === idea.id,
      communityVotes,
      communityShare,
    };
  });
  const preVoteTargetName = community?.targetIdBeforeVote
    ? orderedSides.find((side) => side.idea.id === community.targetIdBeforeVote)?.idea.name
    : null;

  async function submitReason() {
    if (!reason.trim() || !onReason) return;
    setReasonSubmitting(true);
    try {
      await onReason(reason.trim());
    } catch {}
    setReasonSubmitted(true);
    setReasonSubmitting(false);
  }

  return (
    <div className="animate-slide-up mt-5 overflow-hidden border border-fire/30 bg-fire/5">
      <div className="border-b border-fire/20 px-5 py-4">
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-fire">
          <Trophy className="h-3.5 w-3.5" />
          Result
        </div>
        <h2 className="text-2xl font-black leading-tight font-[family-name:var(--font-chakra)]">
          {winner.name} won Elo in this matchup
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your vote moved the SaaS leaderboard. The crowd split shows where the community stands now.
        </p>
      </div>

      <div className="grid gap-px bg-border/20 sm:grid-cols-2">
        {orderedSides.map((side) => (
          <div key={side.idea.id} className="bg-background/80 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className={`text-xs font-bold uppercase tracking-widest ${
                side.isWinner ? "text-emerald-400" : "text-red-400"
              }`}>
                {side.isWinner ? "Won this vote" : "Lost this vote"}
              </p>
              {side.isWinner && (
                <span className="border border-fire/30 bg-fire/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-fire">
                  Your pick
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-lg font-bold">{side.idea.name}</p>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className={side.isWinner ? "font-mono text-fire" : "font-mono text-muted-foreground"}>
                {side.idea.elo_score + side.delta} Elo
              </span>
              <span className={side.delta >= 0 ? "font-mono text-emerald-400" : "font-mono text-red-400"}>
                {side.delta >= 0 ? "+" : ""}{side.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      {community && (
        <div className="border-t border-fire/15 bg-background/75 px-5 py-4">
          <div className="mb-4 flex items-start gap-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-fire" />
            <div>
              <p className="text-sm font-bold">Community vote split</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Based on {community.totalVotes} {community.totalVotes === 1 ? "vote" : "votes"} on this matchup.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {orderedSides.map((side) => {
              const share = side.communityShare ?? 0;
              const boundedShare = Math.max(0, Math.min(100, share));

              return (
                <div key={side.idea.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{side.idea.name}</p>
                      {side.isCommunityLeader && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">community lead</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xl font-black text-foreground">{share}%</p>
                      <p className="text-[10px] text-muted-foreground">{side.communityVotes ?? 0} votes</p>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden bg-border/40">
                    <div
                      className={`h-full ${side.isCommunityLeader ? "bg-emerald-400" : "bg-fire"}`}
                      style={{ width: `${boundedShare}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {prediction && (
        <div className="border-t border-fire/15 bg-background/70 px-5 py-4">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-fire" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {!prediction.ranked
                  ? "No predictor Elo change yet. The community was tied before your vote."
                  : prediction.correct
                    ? `You matched the pre-vote crowd lean${preVoteTargetName ? ` toward ${preVoteTargetName}` : ""}.`
                    : `You went against the pre-vote crowd lean${preVoteTargetName ? ` toward ${preVoteTargetName}` : ""}.`}
              </p>
              {prediction.ranked ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Predictor Elo:{" "}
                  <span className="font-mono text-foreground">{prediction.eloAfter}</span>{" "}
                  <span className={prediction.eloDelta >= 0 ? "font-mono text-emerald-400" : "font-mono text-red-400"}>
                    {prediction.eloDelta >= 0 ? "+" : ""}{prediction.eloDelta}
                  </span>
                  {" "}from {prediction.eloBefore}
                  {prediction.streak > 1 ? ` · ${prediction.streak} correct in a row` : ""}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  The next votes on this matchup become ranked once one side has a clear crowd lead.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {onReason && !reasonSubmitted && (
        <div className="border-t border-fire/15 px-5 py-4">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-fire" />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                Why did you pick <span className="text-fire">{winner.name}</span>?
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Optional — share your reasoning so founders can learn from it.
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                placeholder="e.g. clearer target market, simpler revenue model, lower CAC..."
                rows={2}
                className="mt-2 w-full resize-none rounded-none border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:border-fire/50 focus:outline-none focus:ring-1 focus:ring-fire/30"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-xs text-muted-foreground/60">{reason.length}/500</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReasonSubmitted(true)}
                    className="rounded-none px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={submitReason}
                    disabled={!reason.trim() || reasonSubmitting}
                    className="rounded-none btn-fire bg-fire px-3 py-1 text-xs font-bold uppercase tracking-wider text-fire-foreground hover:bg-fire/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {reasonSubmitting ? "Saving..." : "Share reason"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reasonSubmitted && reason.trim() && (
        <div className="border-t border-fire/15 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            <span className="text-fire font-semibold">Your reason:</span> {reason.trim()}
          </p>
        </div>
      )}

      <ResultUpgradePrompt viewerPlan={viewerPlan} viewerKey={viewerKey} />

      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Share the matchup and let people argue with the result.
        </p>
        <div className="flex flex-wrap gap-2">
          {battleId && (
            <Button onClick={onShare} variant="outline" size="sm" className="gap-2 rounded-none border-fire/30">
              <Share2 className="h-3.5 w-3.5" />
              {shared ? "Copied" : "Share result"}
            </Button>
          )}
          {battleId && (
            <Link
              href={battlePath({ id: battleId, idea_a: sideA, idea_b: sideB })}
              className="inline-flex items-center gap-2 border border-border/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-fire/30 hover:text-fire"
            >
              <Swords className="h-3.5 w-3.5" />
              Challenge link
            </Link>
          )}
          {onNext && (
            <Button onClick={onNext} size="sm" className="rounded-none btn-fire bg-fire text-fire-foreground hover:bg-fire/90">
              Next battle
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
