"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import Link from "next/link";
import { Search, Trash2 } from "lucide-react";
import { CATEGORY_COLORS } from "@/lib/types";

interface AdminIdea {
  id: string;
  name: string;
  pitch: string;
  category: string;
  stage: string;
  elo_score: number;
  wins: number;
  losses: number;
  user_name: string | null;
}

interface IdeasData {
  ideas: AdminIdea[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminIdeasPage() {
  const [data, setData] = useState<IdeasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    fetch(`/api/admin/ideas?${params}`)
      .then((r): Promise<IdeasData> => {
        if (!r.ok) throw new Error("Failed to load ideas");
        return r.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [search, page]);

  async function deleteIdea(ideaId: string) {
    if (!confirm("Delete this idea and all related data?")) return;
    await fetch(`/api/admin/ideas?ideaId=${ideaId}`, { method: "DELETE" });
    setData((prev) => prev ? ({
      ...prev,
      ideas: prev.ideas.filter((i) => i.id !== ideaId),
      total: prev.total - 1,
    }) : prev);
  }

  return (
    <AdminLayout>
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => { setLoading(true); setSearch(e.target.value); setPage(1); }}
          placeholder="Search ideas by name or pitch..."
          className="w-full rounded-none border border-border/50 bg-background/50 pl-10 pr-4 py-2 text-sm focus:border-fire/50 focus:outline-none focus:ring-1 focus:ring-fire/30"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading...</div>
      ) : !data ? (
        <div className="py-20 text-center text-muted-foreground">Failed to load</div>
      ) : (
        <>
          <p className="mb-4 text-xs text-muted-foreground">{data.total} ideas total</p>
          <div className="space-y-1">
            {data.ideas.map((idea) => (
              <div key={idea.id} className="flex items-center gap-3 border border-border/20 bg-card/10 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/idea/${idea.id}`} className="font-semibold text-sm hover:text-fire transition-colors truncate">{idea.name}</Link>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${CATEGORY_COLORS[idea.category] ?? ""}`}>{idea.category}</span>
                    <span className="rounded-full border px-1.5 py-0 text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30">{idea.stage}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{idea.pitch}</p>
                  <p className="text-[10px] text-muted-foreground">by {idea.user_name || "Unknown"}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs shrink-0">
                  <div className="text-center">
                    <p className="font-bold text-fire">{idea.elo_score}</p>
                    <p className="text-[10px] text-muted-foreground">elo</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold"><span className="text-emerald-400">{idea.wins}W</span> / <span className="text-red-400">{idea.losses}L</span></p>
                  </div>
                </div>
                <button
                  onClick={() => deleteIdea(idea.id)}
                  className="rounded-none p-1.5 text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                  title="Delete idea"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button onClick={() => { setLoading(true); setPage(Math.max(1, page - 1)); }} disabled={page === 1} className="rounded-none border border-border/40 px-3 py-1 text-xs disabled:opacity-40">Prev</button>
              <span className="text-xs text-muted-foreground">{page} / {data.totalPages}</span>
              <button onClick={() => { setLoading(true); setPage(Math.min(data.totalPages, page + 1)); }} disabled={page === data.totalPages} className="rounded-none border border-border/40 px-3 py-1 text-xs disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
