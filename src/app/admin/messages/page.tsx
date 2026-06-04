"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Avatar } from "@/components/avatar";
import { Loader2, Trash2 } from "lucide-react";

interface AdminMessage {
  id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  sender_id: string;
  sender_name: string | null;
  sender_email: string;
  sender_image: string | null;
  recipient_id: string;
  recipient_name: string | null;
  recipient_email: string;
  recipient_image: string | null;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/messages?page=${page}`);
        if (!res.ok) throw new Error("Failed to load messages");
        const data = await res.json();
        if (active) {
          setMessages(data.messages);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch {
        if (active) setMessages([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [page]);

  async function handleDelete(messageId: string) {
    if (!confirm("Delete this message?")) return;
    setDeleting(messageId);
    try {
      const res = await fetch(`/api/admin/messages?messageId=${messageId}`, { method: "DELETE" });
      if (res.ok) {
        setPage(1);
      }
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <AdminLayout><div className="py-20 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-fire" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider">Messages ({total})</h2>
      </div>

      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <div className="space-y-1">
          {messages.map((msg) => (
            <div key={msg.id} className="border border-border/20 bg-card/10 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Avatar src={msg.sender_image} name={msg.sender_name} size={20} />
                    <span className="text-sm font-semibold truncate">{msg.sender_name || "Anonymous"}</span>
                    <span className="text-[10px] text-muted-foreground">&rarr;</span>
                    <Avatar src={msg.recipient_image} name={msg.recipient_name} size={20} />
                    <span className="text-sm font-semibold truncate">{msg.recipient_name || "Anonymous"}</span>
                    {!msg.read_at && (
                      <span className="rounded-full bg-fire/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-fire">unread</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(msg.id)}
                  disabled={deleting === msg.id}
                  className="shrink-0 flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
                  title="Delete message"
                >
                  {deleting === msg.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-none border border-border/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
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