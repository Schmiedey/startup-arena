"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";

interface AdminVote {
  id: string;
  reason: string;
  created_at: string;
  voter_name: string | null;
  winner_name: string;
  winner_elo: number;
  loser_name: string;
  loser_elo: number;
}

interface VotesData {
  votes: AdminVote[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminVotesPage() {
  const [data, setData] = useState<VotesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`/api/admin/votes?page=${page}`)
      .then((r): Promise<VotesData> => {
        if (!r.ok) throw new Error("Failed to load votes");
        return r.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <AdminLayout>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">Vote Reasons</h2>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading...</div>
      ) : !data ? (
        <div className="py-20 text-center text-muted-foreground">Failed to load</div>
      ) : data.votes.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">No vote reasons yet</div>
      ) : (
        <>
          <p className="mb-4 text-xs text-muted-foreground">{data.total} reasons total</p>
          <div className="space-y-2">
            {data.votes.map((v) => (
              <div key={v.id} className="border border-border/20 bg-card/10 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">{v.winner_name}</span>
                      <span className="text-xs text-muted-foreground">beat</span>
                      <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400 uppercase">{v.loser_name}</span>
                      <span className="text-[10px] text-muted-foreground">({v.winner_elo} vs {v.loser_elo})</span>
                    </div>
                    <p className="text-sm">{v.reason}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      by {v.voter_name || "Anonymous"} · {new Date(v.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
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
