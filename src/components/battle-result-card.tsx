"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Crown, Share2, Sparkles, Swords, Trophy, MessageCircle, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Idea } from "@/lib/types";
import { battlePath } from "@/lib/seo";
import { trackClientEvent } from "@/lib/analytics-client";
import { useDismissiblePrompt } from "@/lib/use-dismissible-prompt";

interface BattleResultCardProps {
  winner: Idea;
  loser: Idea;
  battleId: string | null;
  winnerDelta: number;
  loserDelta: number;
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
  battleId,
  winnerDelta,
  loserDelta,
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
  const winnerCommunityVotes = community
    ? winner.id === community.ideaAId
      ? community.ideaAVotes
      : community.ideaBVotes
    : null;
  const loserCommunityVotes = community
    ? loser.id === community.ideaAId
      ? community.ideaAVotes
      : community.ideaBVotes
    : null;
  const winnerCommunityShare = community && winnerCommunityVotes !== null && community.totalVotes > 0
    ? Math.round((winnerCommunityVotes / community.totalVotes) * 100)
    : null;
  const loserCommunityShare = community && loserCommunityVotes !== null && community.totalVotes > 0
    ? Math.round((loserCommunityVotes / community.totalVotes) * 100)
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
          {winner.name} beat {loser.name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your pick gained SaaS Elo from this head-to-head vote.
        </p>
      </div>

      <div className="grid gap-px bg-border/20 sm:grid-cols-2">
        <div className="bg-background/80 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Winner</p>
          <p className="mt-1 truncate text-lg font-bold">{winner.name}</p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="font-mono text-fire">{winner.elo_score + winnerDelta} Elo</span>
            <span className="font-mono text-emerald-400">+{winnerDelta}</span>
          </div>
        </div>
        <div className="bg-background/80 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-red-400">Eliminated</p>
          <p className="mt-1 truncate text-lg font-bold">{loser.name}</p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="font-mono text-muted-foreground">{loser.elo_score + loserDelta} Elo</span>
            <span className="font-mono text-red-400">{loserDelta}</span>
          </div>
        </div>
      </div>

      {prediction && (
        <div className="border-t border-fire/15 bg-background/70 px-5 py-4">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-fire" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {!prediction.ranked
                  ? "Provisional guess: the community was tied before your vote."
                  : prediction.correct
                    ? "You guessed with the community majority."
                    : "You guessed against the community majority."}
              </p>
              {community && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Community now:{" "}
                  <span className="font-mono text-foreground">
                    {winnerCommunityShare ?? 0}%
                  </span>{" "}
                  {winner.name} /{" "}
                  <span className="font-mono text-foreground">
                    {loserCommunityShare ?? 0}%
                  </span>{" "}
                  {loser.name}
                </p>
              )}
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
                  Once the community has a clear pre-vote lean, matching it raises your predictor Elo and missing it lowers your score.
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
              href={battlePath({ id: battleId, idea_a: winner, idea_b: loser })}
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
