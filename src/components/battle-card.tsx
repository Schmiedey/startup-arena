"use client";

import { useState } from "react";
import { Idea, STAGE_COLORS, CATEGORY_COLORS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSurvivalRating } from "@/lib/elo";
import { Trophy, Zap, TrendingUp } from "lucide-react";

interface BattleCardProps {
  idea: Idea;
  onVote: (ideaId: string) => void;
  voted: boolean;
  isWinner?: boolean;
  isLoser?: boolean;
}

export function BattleCard({
  idea,
  onVote,
  voted,
  isWinner,
  isLoser,
}: BattleCardProps) {
  const survivalRating = getSurvivalRating(idea.elo_score);
  const [pressing, setPressing] = useState(false);

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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-xl font-bold leading-tight">{idea.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{idea.pitch}</p>
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
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-background/80 p-3 animate-slide-up">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Record</p>
              <p className="text-sm font-semibold">
                <span className="text-emerald-400">{idea.wins}W</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-red-400">{idea.losses}L</span>
              </p>
            </div>
            <div className="text-center border-x border-border/50">
              <p className="text-xs text-muted-foreground">Elo</p>
              <p className="text-sm font-bold text-fire">{idea.elo_score}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Survival</p>
              <p className="text-sm font-bold text-emerald-400">{survivalRating}%</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/30 bg-background/60 p-3 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ratings hidden</p>
            <p className="mt-1 text-xs text-muted-foreground">Pick first. See score after.</p>
          </div>
        )}

        {!voted && (
          <Button
            onClick={() => { setPressing(true); setTimeout(() => setPressing(false), 350); onVote(idea.id); }}
            className={`w-full btn-fire bg-fire text-fire-foreground hover:bg-fire/90 font-semibold tracking-wide uppercase text-sm ${pressing ? "btn-fire-press" : ""}`}
            size="lg"
          >
            <Trophy className="mr-2 h-4 w-4" />
            This one wins
          </Button>
        )}
        {voted && isWinner && (
          <div className="animate-pulse-fire text-center py-2">
            <span className="text-lg font-black tracking-wider text-fire">
              WINNER
            </span>
          </div>
        )}
        {voted && isLoser && (
          <div className="text-center py-2">
            <span className="text-sm font-medium tracking-wider text-muted-foreground">
              ELIMINATED
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
