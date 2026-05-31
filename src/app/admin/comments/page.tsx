"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import Link from "next/link";
import { Trash2 } from "lucide-react";

interface AdminComment {
  id: string;
  body: string;
  created_at: string;
  user_name: string | null;
  idea_name: string;
  idea_id: string;
}

interface CommentsData {
  comments: AdminComment[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminCommentsPage() {
  const [data, setData] = useState<CommentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`/api/admin/comments?page=${page}`)
      .then((r): Promise<CommentsData> => {
        if (!r.ok) throw new Error("Failed to load comments");
        return r.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page]);

  async function deleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    await fetch(`/api/admin/comments?commentId=${commentId}`, { method: "DELETE" });
    setData((prev) => prev ? ({
      ...prev,
      comments: prev.comments.filter((c) => c.id !== commentId),
      total: prev.total - 1,
    }) : prev);
  }

  return (
    <AdminLayout>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">Comments</h2>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading...</div>
      ) : !data ? (
        <div className="py-20 text-center text-muted-foreground">Failed to load</div>
      ) : data.comments.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">No comments yet</div>
      ) : (
        <>
          <p className="mb-4 text-xs text-muted-foreground">{data.total} comments total</p>
          <div className="space-y-2">
            {data.comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3 border border-border/20 bg-card/10 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{c.user_name || "Anonymous"}</span>
                    <span className="text-[10px] text-muted-foreground">on</span>
                    <Link href={`/idea/${c.idea_id}`} className="text-xs text-fire hover:underline">{c.idea_name}</Link>
                    <span className="text-[10px] text-muted-foreground">· {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.body}</p>
                </div>
                <button
                  onClick={() => deleteComment(c.id)}
                  className="rounded-none p-1.5 text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                  title="Delete comment"
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
