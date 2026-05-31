"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import Link from "next/link";
import { Users, Lightbulb, Vote, Swords, MessageSquare } from "lucide-react";

interface Stats {
  users: number;
  ideas: number;
  votes: number;
  battles: number;
  comments: number;
  newUsersToday: number;
  newIdeasToday: number;
  newVotesToday: number;
  newCommentsToday: number;
}

interface TopIdea {
  id: string;
  name: string;
  founder: string | null;
  elo_score: number;
  wins: number;
  losses: number;
}

interface CategoryBreakdown {
  category: string;
  count: number | string;
  avg_elo: number | string;
}

interface RecentActivity {
  type: "vote" | "idea" | "comment";
  user_name: string | null;
  idea_name: string;
  created_at: string;
}

interface AdminStatsData {
  stats: Stats;
  topIdeas: TopIdea[];
  categoryBreakdown: CategoryBreakdown[];
  recentActivity: RecentActivity[];
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r): Promise<AdminStatsData> => {
        if (!r.ok) throw new Error("Failed to load admin stats");
        return r.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></AdminLayout>;
  if (!data) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Failed to load stats</div></AdminLayout>;

  const stats = data.stats;

  return (
    <AdminLayout>
      <div className="grid grid-cols-2 gap-px border border-border/30 sm:grid-cols-5">
        {[
          { label: "Users", value: stats.users, today: stats.newUsersToday, icon: Users, color: "text-blue-400" },
          { label: "Ideas", value: stats.ideas, today: stats.newIdeasToday, icon: Lightbulb, color: "text-fire" },
          { label: "Votes", value: stats.votes, today: stats.newVotesToday, icon: Vote, color: "text-emerald-400" },
          { label: "Battles", value: stats.battles, today: null, icon: Swords, color: "text-amber-400" },
          { label: "Comments", value: stats.comments, today: stats.newCommentsToday, icon: MessageSquare, color: "text-violet-400" },
        ].map(({ label, value, today, icon: Icon, color }) => (
          <div key={label} className="bg-card/30 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-black font-[family-name:var(--font-chakra)]">{value}</p>
            {today !== null && today > 0 && (
              <p className="text-[10px] text-emerald-400">+{today} today</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        {/* Top ideas */}
        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">Top Ideas</h2>
          <div className="space-y-1">
            {data.topIdeas.map((idea, i) => (
              <Link key={idea.id} href={`/idea/${idea.id}`} className="block">
                <div className="flex items-center justify-between border border-border/20 bg-card/10 px-3 py-2 hover:bg-panel/20 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">{i + 1}</span>
                    <span className="text-sm font-semibold truncate">{idea.name}</span>
                    {idea.founder && <span className="text-xs text-muted-foreground hidden sm:inline">by {idea.founder}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="text-fire font-bold">{idea.elo_score}</span>
                    <span className="text-emerald-400">{idea.wins}W</span>
                    <span className="text-red-400">{idea.losses}L</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">By Category</h2>
          <div className="space-y-1">
            {data.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between border border-border/20 bg-card/10 px-3 py-2">
                <span className="text-sm font-semibold">{cat.category}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span>{cat.count} ideas</span>
                  <span className="text-muted-foreground">avg {cat.avg_elo} elo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">Recent Activity</h2>
        <div className="space-y-1">
          {data.recentActivity.map((act, i) => (
            <div key={i} className="flex items-center justify-between border border-border/20 bg-card/10 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  act.type === "vote" ? "bg-emerald-500/15 text-emerald-400" :
                  act.type === "idea" ? "bg-fire/15 text-fire" :
                  "bg-violet-500/15 text-violet-400"
                }`}>{act.type}</span>
                <span className="text-sm truncate">{act.user_name || "Anonymous"}</span>
                {act.type === "vote" && <span className="text-xs text-muted-foreground">voted for {act.idea_name}</span>}
                {act.type === "idea" && <span className="text-xs text-muted-foreground">submitted {act.idea_name}</span>}
                {act.type === "comment" && <span className="text-xs text-muted-foreground">commented on {act.idea_name}</span>}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {new Date(act.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
