import { Idea, CATEGORY_COLORS, STAGE_COLORS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { getWinRate, getSurvivalRating, formatElo } from "@/lib/elo";
import Link from "next/link";

interface IdeaCardProps {
  idea: Idea;
  rank: number;
}

export function IdeaCard({ idea, rank }: IdeaCardProps) {
  const winRate = getWinRate(idea.wins, idea.losses);
  const survival = getSurvivalRating(idea.elo_score);
  const eloTier = formatElo(idea.elo_score);

  return (
    <Link href={`/idea/${idea.id}`}>
      <div className="group relative flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 p-4 transition-all hover:border-fire/40 hover:bg-panel/30 hover:shadow-[0_0_20px_rgba(220,60,30,0.08)]">
        {rank <= 3 && (
          <div className="absolute -left-px -top-px h-8 w-8 rounded-tl-xl rounded-br-lg bg-fire/10 flex items-center justify-center border-b border-r border-fire/20">
            <span className="text-xs font-black text-fire">#{rank}</span>
          </div>
        )}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-panel font-mono text-lg font-bold text-fire">
          {rank > 3 ? `#${rank}` : ["", "1st", "2nd", "3rd"][rank]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{idea.name}</h3>
            <Badge variant="outline" className={`${STAGE_COLORS[idea.stage] ?? ""} text-xs px-1.5 py-0`}>
              {idea.stage}
            </Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">{idea.pitch}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="secondary" className={`${CATEGORY_COLORS[idea.category] ?? ""} text-xs px-1.5 py-0`}>
              {idea.category}
            </Badge>
            {typeof idea.controversy_score === "number" && idea.controversy_score > 0 && (
              <Badge variant="outline" className="border-fire/30 bg-fire/5 px-1.5 py-0 text-xs text-fire">
                {idea.controversy_score} heat
              </Badge>
            )}
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-5 sm:flex">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Win Rate</p>
            <p className="text-lg font-bold tabular-nums text-fire">{winRate}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Survival</p>
            <p className="text-lg font-bold tabular-nums text-emerald-400">{survival}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Elo</p>
            <p className="text-lg font-bold tabular-nums">{idea.elo_score}</p>
            <p className="text-xs text-muted-foreground">{eloTier}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}