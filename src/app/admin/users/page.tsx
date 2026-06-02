"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Avatar } from "@/components/avatar";
import { Search, Shield, ShieldOff, Trash2, Ban } from "lucide-react";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  is_admin: boolean;
  banned: boolean;
  is_bot?: boolean;
  ideas_count: number | string;
  total_wins: number | string;
  total_losses: number | string;
  votes_cast: number | string;
}

interface UsersData {
  users: AdminUser[];
  total: number;
  botTotal?: number;
  totalRecords?: number;
  page: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    fetch(`/api/admin/users?${params}`)
      .then((r): Promise<UsersData> => {
        if (!r.ok) throw new Error("Failed to load users");
        return r.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [search, page]);

  async function toggleAdmin(userId: string, current: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, is_admin: !current }),
    });
    setData((prev) => prev ? ({
      ...prev,
      users: prev.users.map((u) => u.id === userId ? { ...u, is_admin: !current } : u),
    }) : prev);
  }

  async function toggleBan(userId: string, current: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, banned: !current }),
    });
    setData((prev) => prev ? ({
      ...prev,
      users: prev.users.map((u) => u.id === userId ? { ...u, banned: !current } : u),
    }) : prev);
  }

  async function deleteUser(userId: string) {
    if (!confirm("Delete this user and all their data? This cannot be undone.")) return;
    await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
    setData((prev) => prev ? ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
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
          placeholder="Search users by name or email..."
          className="w-full rounded-none border border-border/50 bg-background/50 pl-10 pr-4 py-2 text-sm focus:border-fire/50 focus:outline-none focus:ring-1 focus:ring-fire/30"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading...</div>
      ) : !data ? (
        <div className="py-20 text-center text-muted-foreground">Failed to load</div>
      ) : (
        <>
          <p className="mb-4 text-xs text-muted-foreground">
            {data.total} real customer users total · {data.botTotal ?? 0} bots labeled and excluded
          </p>
          <div className="space-y-1">
            {data.users.map((u) => {
              const karma = Number(u.total_wins) * 5 + Number(u.votes_cast) * 1 + Number(u.ideas_count) * 10;
              return (
                <div key={u.id} className="flex items-center gap-3 border border-border/20 bg-card/10 px-4 py-3">
                  <Avatar src={u.image} name={u.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{u.name || "Anonymous"}</span>
                      {u.is_bot && <span className="rounded-full bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-bold text-sky-400">BOT</span>}
                      {u.is_admin && <span className="rounded-full bg-fire/15 px-1.5 py-0.5 text-[10px] font-bold text-fire">ADMIN</span>}
                      {u.banned && <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">BANNED</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs shrink-0">
                    <div className="text-center">
                      <p className="font-bold">{u.ideas_count}</p>
                      <p className="text-[10px] text-muted-foreground">ideas</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-fire">{karma}</p>
                      <p className="text-[10px] text-muted-foreground">karma</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold"><span className="text-emerald-400">{u.total_wins}W</span> <span className="text-muted-foreground">/</span> <span className="text-red-400">{u.total_losses}L</span></p>
                      <p className="text-[10px] text-muted-foreground">record</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleAdmin(u.id, u.is_admin)}
                      className="rounded-none p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title={u.is_admin ? "Remove admin" : "Make admin"}
                    >
                      {u.is_admin ? <Shield className="h-4 w-4 text-fire" /> : <ShieldOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => toggleBan(u.id, u.banned)}
                      className="rounded-none p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                      title={u.banned ? "Unban user" : "Ban user"}
                    >
                      <Ban className={`h-4 w-4 ${u.banned ? "text-red-400" : ""}`} />
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="rounded-none p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => { setLoading(true); setPage(Math.max(1, page - 1)); }}
                disabled={page === 1}
                className="rounded-none border border-border/40 px-3 py-1 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs text-muted-foreground">{page} / {data.totalPages}</span>
              <button
                onClick={() => { setLoading(true); setPage(Math.min(data.totalPages, page + 1)); }}
                disabled={page === data.totalPages}
                className="rounded-none border border-border/40 px-3 py-1 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
