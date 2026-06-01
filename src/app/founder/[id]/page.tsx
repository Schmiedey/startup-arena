import { sql } from "@vercel/postgres";
import { getWinRate, getSurvivalRating, formatElo } from "@/lib/elo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crown, TrendingUp, Zap, Trophy } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, extractEntityId, founderPath, ideaPath } from "@/lib/seo";

export default async function FounderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = extractEntityId(rawId);

  let user, ideas, stats, karmaData;

  try {
    const userResult = await sql`
      SELECT id, name, image, created_at FROM users WHERE id = ${id}
    `;
    user = userResult.rows[0];
    if (!user) notFound();

    const ideasResult = await sql`
      SELECT id, name, pitch, category, stage, elo_score, wins, losses, created_at FROM ideas WHERE user_id = ${id} ORDER BY elo_score DESC
    `;
    ideas = ideasResult.rows;

    const statsResult = await sql`
      SELECT
        COUNT(*) as total_ideas,
        COALESCE(SUM(wins), 0) as total_wins,
        COALESCE(SUM(losses), 0) as total_losses,
        COALESCE(MAX(elo_score), 1000) as max_elo
      FROM ideas WHERE user_id = ${id}
    `;
    stats = statsResult.rows[0];

    const karmaResult = await sql`
      SELECT COUNT(*) as votes_cast FROM votes WHERE user_id = ${id}
    `;
    karmaData = karmaResult.rows[0];
  } catch {
    notFound();
  }

  const totalWins = Number(stats.total_wins);
  const totalLosses = Number(stats.total_losses);
  const totalBattles = totalWins + totalLosses;
  const winRate = totalBattles > 0 ? Math.round((totalWins / totalBattles) * 100) : 0;
  const bestElo = Number(stats.max_elo);
  const bestTier = formatElo(bestElo);
  const votesCast = Number(karmaData.votes_cast);
  const ideasCount = Number(stats.total_ideas);
  const karma = totalWins * 5 + votesCast * 1 + ideasCount * 10;
  const displayName = user.name ?? "Anonymous founder";
  const profilePath = founderPath({ id, name: user.name });

  const KARMA_TIERS = [
    { min: 200, label: "Veteran", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { min: 100, label: "Proven", color: "text-fire", bg: "bg-fire/10" },
    { min: 50, label: "Rising", color: "text-amber-400", bg: "bg-amber-400/10" },
    { min: 10, label: "Newcomer", color: "text-blue-400", bg: "bg-blue-400/10" },
    { min: 0, label: "Fresh", color: "text-zinc-500", bg: "bg-zinc-500/10" },
  ];

  const tier = KARMA_TIERS.find((t) => karma >= t.min) ?? KARMA_TIERS[KARMA_TIERS.length - 1];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${absoluteUrl(profilePath)}#profile`,
    name: `${displayName} founder profile`,
    url: absoluteUrl(profilePath),
    dateCreated: user.created_at,
    mainEntity: {
      "@type": "Person",
      name: displayName,
      image: user.image ?? undefined,
      url: absoluteUrl(profilePath),
      knowsAbout: ["startup ideas", "startup validation", "business ideas"],
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: { "@type": "CreateAction" },
          userInteractionCount: ideasCount,
        },
        {
          "@type": "InteractionCounter",
          interactionType: { "@type": "VoteAction" },
          userInteractionCount: votesCast,
        },
      ],
    },
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <JsonLd data={jsonLd} />
      <Link
        href="/founders"
        className="mb-6 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; founders
      </Link>

<div className="mb-8 flex items-center gap-5">
        <Avatar src={user.image} name={user.name} size={64} className="border-2 border-border/50" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black">{displayName}</h1>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tier.color} ${tier.bg}`}>
              {tier.label}
            </span>
          </div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Karma + stats grid */}
      <div className="grid grid-cols-2 gap-px border border-border/30 sm:grid-cols-5">
        <div className="bg-card/30 p-4 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">karma</p>
          <p className="text-2xl font-black text-fire font-[family-name:var(--font-chakra)]">{karma}</p>
        </div>
        <div className="bg-card/30 p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">ideas</p>
          <p className="text-2xl font-black">{ideasCount}</p>
        </div>
        <div className="bg-card/30 p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">win rate</p>
          <p className="text-2xl font-black text-fire">{winRate}%</p>
        </div>
        <div className="bg-card/30 p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">best elo</p>
          <p className="text-2xl font-black">{bestElo} <span className="text-xs text-muted-foreground">{bestTier}</span></p>
        </div>
        <div className="bg-card/30 p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">record</p>
          <p className="text-2xl font-black">
            <span className="text-emerald-400">{totalWins}W</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-red-400">{totalLosses}L</span>
          </p>
        </div>
      </div>

      {/* Karma breakdown */}
      <div className="mt-6 border border-border/30 bg-card/20 p-4">
        <h3 className="mb-3 text-sm font-bold">Karma Breakdown</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-fire" />
              <span className="text-muted-foreground">Ideas submitted</span>
            </div>
            <span className="font-mono tabular-nums">{ideasCount} &times; 10 = <span className="font-bold text-fire">{ideasCount * 10}</span></span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-muted-foreground">Battle wins</span>
            </div>
            <span className="font-mono tabular-nums">{totalWins} &times; 5 = <span className="font-bold text-emerald-400">{totalWins * 5}</span></span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-muted-foreground">Votes cast</span>
            </div>
            <span className="font-mono tabular-nums">{votesCast} &times; 1 = <span className="font-bold text-amber-400">{votesCast}</span></span>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold flex items-center gap-2">
        <Crown className="h-4 w-4 text-fire" />
        ideas
      </h2>
      {ideas.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">no ideas submitted yet.</p>
      ) : (
        <div className="mt-3 space-y-1">
          {ideas.map((idea: Record<string, string | number>) => {
            const iWinRate = getWinRate(Number(idea.wins), Number(idea.losses));
            const iSurvival = getSurvivalRating(Number(idea.elo_score));
            return (
              <Link
                key={String(idea.id)}
                href={ideaPath({ id: String(idea.id), name: String(idea.name) })}
                className="block"
              >
                <div className="flex items-center gap-4 border border-border/20 bg-card/10 px-4 py-3 transition-colors hover:bg-panel/20 hover:border-fire/20">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{String(idea.name)}</p>
                    <p className="truncate text-xs text-muted-foreground">{String(idea.pitch)}</p>
                  </div>
                  <div className="hidden shrink-0 gap-4 text-xs sm:flex">
                    <div className="text-right">
                      <p className="font-bold text-fire">{Number(idea.elo_score)}</p>
                      <p className="text-[10px] text-muted-foreground">elo</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">{iWinRate}%</p>
                      <p className="text-[10px] text-muted-foreground">win</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-400">{iSurvival}%</p>
                      <p className="text-[10px] text-muted-foreground">survival</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
