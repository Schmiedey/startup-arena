"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Idea, STAGE_COLORS, CATEGORY_COLORS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSurvivalRating } from "@/lib/elo";
import { Crown, ExternalLink, Trophy, Zap, TrendingUp, Mail, Users } from "lucide-react";
import Image from "next/image";
import { Avatar } from "@/components/avatar";
import { founderPath } from "@/lib/seo";
import { trackClientEvent } from "@/lib/analytics-client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface BattleCardProps {
  idea: Idea;
  onVote: (ideaId: string) => void;
  voted: boolean;
  isWinner?: boolean;
  isLoser?: boolean;
  communityShare?: number | null;
  communityVotes?: number | null;
  communityTotalVotes?: number | null;
  isCommunityLeader?: boolean;
  eloDelta?: number;
}

export function BattleCard({
  idea,
  onVote,
  voted,
  isWinner,
  isLoser,
  communityShare,
  communityVotes,
  communityTotalVotes,
  isCommunityLeader,
  eloDelta = 0,
}: BattleCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const displayedElo = idea.elo_score + (voted ? eloDelta : 0);
  const displayedWins = idea.wins + (voted && isWinner ? 1 : 0);
  const displayedLosses = idea.losses + (voted && isLoser ? 1 : 0);
  const survivalRating = getSurvivalRating(displayedElo);
  const [pressing, setPressing] = useState(false);
  const isPaidIdea = idea.user_plan === "launch" || idea.user_plan === "pro";
  const hasCommunitySplit = voted && communityShare !== null && communityShare !== undefined && communityTotalVotes !== null && communityTotalVotes !== undefined && communityTotalVotes > 0;
  const boundedCommunityShare = Math.max(0, Math.min(100, communityShare ?? 0));

  useEffect(() => {
    if (!voted || !isPaidIdea || !idea.user_id) return;
    trackClientEvent("premium_battle_card_viewed", {
      idea_id: idea.id,
      member_user_id: idea.user_id,
      profile_user_id: idea.user_id,
      plan: idea.user_plan,
    });
  }, [idea.id, idea.user_id, idea.user_plan, isPaidIdea, voted]);

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-500 ${
        isWinner
          ? "border-fire/60 ring-2 ring-fire/40 shadow-[0_0_50px_rgba(220,60,30,0.25)] animate-winner-reveal"
          : isLoser
            ? "opacity-40 scale-[0.97] blur-[0.5px]"
            : "hover:border-fire/30 hover:shadow-[0_0_30px_rgba(220,60,30,0.1)]"
      }`}
    >
      {isWinner && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fire via-ember to-fire shimmer" />
      )}
      <div className="p-5 space-y-4">
        {idea.image_url && (
          <div className="relative -mx-5 -mt-5 mb-4 overflow-hidden">
            <Image
              src={idea.image_url}
              alt={idea.name}
              width={400}
              height={160}
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card/90 to-transparent" />
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-xl font-bold leading-tight">{idea.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{idea.pitch}</p>
            {voted && idea.user_id && idea.user_name && session?.user && session.user.id !== idea.user_id && !isPaidIdea && (
              <button
                onClick={() => router.push(`/messages/${idea.user_id}`)}
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-fire transition-colors"
              >
                <Mail className="h-3 w-3" />
                Message {idea.user_name.split(" ")[0]}
              </button>
            )}
          </div>
          <Badge
            variant="outline"
            className={STAGE_COLORS[idea.stage] ?? ""}
          >
            {idea.stage}
          </Badge>
        </div>

        <Badge variant="secondary" className={`${CATEGORY_COLORS[idea.category] ?? ""} text-xs`}>
          {idea.category}
        </Badge>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Target</p>
              <p className="text-sm">{idea.target_customer}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Revenue</p>
              <p className="text-sm">{idea.revenue_model}</p>
            </div>
          </div>
        </div>

        {voted ? (
          <div className="space-y-3 animate-slide-up">
            {hasCommunitySplit && (
              <div className={`border p-3 ${
                isCommunityLeader ? "border-emerald-400/35 bg-emerald-400/10" : "border-border/35 bg-background/75"
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Users className="h-3 w-3 text-fire" />
                    Community
                  </div>
                  {isCommunityLeader && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      crowd lead
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-2xl font-black leading-none text-foreground">{boundedCommunityShare}%</p>
                  <p className="pb-0.5 text-xs text-muted-foreground">
                    {communityVotes ?? 0}/{communityTotalVotes} votes
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden bg-border/40">
                  <div
                    className={`h-full ${isCommunityLeader ? "bg-emerald-400" : "bg-fire"}`}
                    style={{ width: `${boundedCommunityShare}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 rounded-lg bg-background/80 p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Record</p>
                <p className="text-sm font-semibold">
                  <span className="text-emerald-400">{displayedWins}W</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-red-400">{displayedLosses}L</span>
                </p>
              </div>
              <div className="text-center border-x border-border/50">
                <p className="text-xs text-muted-foreground">Elo</p>
                <p className="text-sm font-bold text-fire">{displayedElo}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Survival</p>
                <p className="text-sm font-bold text-emerald-400">{survivalRating}%</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/30 bg-background/60 p-3 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">crowd hidden</p>
            <p className="mt-1 text-xs text-muted-foreground">Pick first. The community split unlocks after.</p>
          </div>
        )}

        {voted && isPaidIdea && idea.user_id && (
          <div className="animate-slide-up border border-fire/20 bg-fire/5 p-3">
            <div className="flex items-start gap-3">
              <Avatar src={idea.user_image} name={idea.user_name} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold">{idea.user_name || "Founder"}</span>
                  <span className="inline-flex items-center gap-1 border border-fire/30 bg-background/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fire">
                    <Crown className="h-2.5 w-2.5" />
                    {idea.user_plan === "pro" ? "Pro" : "Launch"}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {idea.profile_headline || "Featured paid member"}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href={founderPath({ id: idea.user_id, name: idea.user_name })}
                className="inline-flex flex-1 items-center justify-center border border-border/40 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-fire/30 hover:text-fire"
              >
                Profile
              </Link>
              {session?.user && session.user.id !== idea.user_id && (
                <button
                  onClick={() => router.push(`/messages/${idea.user_id}`)}
                  className="inline-flex items-center justify-center gap-1 border border-fire/35 bg-fire/10 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-fire transition-colors hover:bg-fire/15"
                >
                  <Mail className="h-3 w-3" />
                  Message
                </button>
              )}
              {idea.profile_cta_url && (
                <a
                  href={idea.profile_cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackClientEvent("premium_battle_card_cta_clicked", {
                      idea_id: idea.id,
                      member_user_id: idea.user_id,
                      profile_user_id: idea.user_id,
                      plan: idea.user_plan,
                    });
                  }}
                  className="inline-flex items-center justify-center gap-1 border border-fire/35 bg-fire/10 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-fire transition-colors hover:bg-fire/15"
                >
                  {idea.profile_cta_label || "Visit"}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {!voted && (
          <Button
            onClick={() => { setPressing(true); setTimeout(() => setPressing(false), 350); onVote(idea.id); }}
            className={`w-full btn-fire bg-fire text-fire-foreground hover:bg-fire/90 font-semibold tracking-wide uppercase text-sm ${pressing ? "btn-fire-press" : ""}`}
            size="lg"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Back this SaaS
          </Button>
        )}
        {voted && isWinner && (
          <div className="animate-pulse-fire text-center py-2">
            <span className="text-lg font-black tracking-wider text-fire">
              ELO WIN
            </span>
          </div>
        )}
        {voted && isLoser && (
          <div className="text-center py-2">
            <span className="text-sm font-medium tracking-wider text-muted-foreground">
              ELO LOSS
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
