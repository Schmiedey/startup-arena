"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Loader2, Check, X, Trash2, Search } from "lucide-react";
import Link from "next/link";

interface AdminIdea {
  id: string;
  name: string;
  pitch: string;
  category: string;
  stage: string;
  elo_score: number;
  wins: number;
  losses: number;
  status: string;
  image_url: string | null;
  created_at: string;
  user_id: string | null;
  user_name: string | null;
  user_image: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function AdminIdeasPage() {
  const [ideas, setIdeas] = useState<AdminIdea[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);

  const load = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), search, status: statusFilter });
      const res = await fetch(`/api/admin/ideas?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setIdeas(data.ideas);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      try {
        const res = await fetch(`/api/admin/ideas?${params}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (active) {
          setIdeas(data.ideas);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch {
        if (active) setIdeas([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [page, search, statusFilter]);

  async function handleApprove(ideaId: string) {
    setActioning(ideaId);
    try {
      const res = await fetch("/api/admin/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, status: "approved" }),
      });
      if (res.ok) await load();
    } catch {
      // ignore
    } finally {
      setActioning(null);
    }
  }

  async function handleReject(ideaId: string) {
    setActioning(ideaId);
    try {
      const res = await fetch("/api/admin/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, status: "rejected" }),
      });
      if (res.ok) await load();
    } catch {
      // ignore
    } finally {
      setActioning(null);
    }
  }

  async function handleDelete(ideaId: string) {
    if (!confirm("Delete this idea permanently?")) return;
    setActioning(ideaId);
    try {
      const res = await fetch(`/api/admin/ideas?ideaId=${ideaId}`, { method: "DELETE" });
      if (res.ok) await load();
    } catch {
      // ignore
    } finally {
      setActioning(null);
    }
  }

  if (loading) return <AdminLayout><div className="py-20 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-fire" /></div></AdminLayout>;

  const pendingCount = ideas.filter((i) => i.status === "pending").length;

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider">Ideas ({total})</h2>
        <div className="flex items-center gap-2">
          {statusFilter !== "pending" && (
            <span className="text-xs text-muted-foreground">Filter:</span>
          )}
          <div className="flex gap-1">
            {["", "pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`rounded-none px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  statusFilter === s
                    ? "bg-fire/10 text-fire border border-fire/30"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                {s || "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search ideas..."
          className="w-full rounded-none border border-border/40 bg-card/20 py-2 pl-9 pr-3 text-sm outline-none focus:border-fire/50"
        />
      </div>

      {pendingCount > 0 && statusFilter !== "approved" && statusFilter !== "rejected" && (
        <div className="mb-3 border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
          {pendingCount} idea{pendingCount > 1 ? "s" : ""} pending review
        </div>
      )}

      <div className="space-y-1">
        {ideas.map((idea) => (
          <div key={idea.id} className="border border-border/20 bg-card/10 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/idea/${idea.id}`} className="text-sm font-semibold hover:text-fire transition-colors truncate">
                    {idea.name}
                  </Link>
                  <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[idea.status] || STATUS_COLORS.pending}`}>
                    {idea.status}
                  </span>
                  {idea.image_url && (
                    <span className="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-400">has image</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{idea.pitch}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{idea.category}</span>
                  <span>·</span>
                  <span>{idea.stage}</span>
                  <span>·</span>
                  <span className="text-fire font-semibold">{idea.elo_score} Elo</span>
                  <span>·</span>
                  <span className="text-emerald-400">{idea.wins}W</span>
                  <span className="text-red-400">{idea.losses}L</span>
                  {idea.user_name && (
                    <>
                      <span>·</span>
                      <span>by {idea.user_name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {idea.status !== "approved" && (
                  <button
                    onClick={() => handleApprove(idea.id)}
                    disabled={actioning === idea.id}
                    className="flex items-center gap-1 rounded-none border border-emerald-500/30 bg-emerald-500/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40"
                    title="Approve"
                  >
                    {actioning === idea.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Approve
                  </button>
                )}
                {idea.status !== "rejected" && (
                  <button
                    onClick={() => handleReject(idea.id)}
                    disabled={actioning === idea.id}
                    className="flex items-center gap-1 rounded-none border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-500/10 disabled:opacity-40"
                    title="Reject"
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </button>
                )}
                <button
                  onClick={() => handleDelete(idea.id)}
                  disabled={actioning === idea.id}
                  className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-red-400 disabled:opacity-40"
                  title="Delete"
                >
                  {actioning === idea.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-none border border-border/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-none border border-border/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
}