"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Send, Loader2, MailOpen } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Conversation {
  other_user_id: string;
  other_user_name: string | null;
  other_user_image: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
  sender_id: string;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  sender_name: string | null;
  sender_image: string | null;
  recipient_name: string | null;
  recipient_image: string | null;
}

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUserId = params.userId as string;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
      return;
    }
    if (status !== "authenticated") return;
    let active = true;
    (async () => {
      try {
        const [msgRes, convRes] = await Promise.all([
          fetch(`/api/messages?with=${otherUserId}`),
          fetch("/api/messages"),
        ]);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          if (active) setMessages(msgData.messages || []);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
        if (convRes.ok) {
          const convData = await convRes.json();
          if (active) setConversations(convData.conversations || []);
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [status, otherUserId, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const id = setInterval(async () => {
      try {
        const [msgRes, convRes] = await Promise.all([
          fetch(`/api/messages?with=${otherUserId}`),
          fetch("/api/messages"),
        ]);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData.messages || []);
        }
        if (convRes.ok) {
          const convData = await convRes.json();
          setConversations(convData.conversations || []);
        }
      } catch {
        // ignore
      }
    }, 8000);
    return () => clearInterval(id);
  }, [status, otherUserId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || !otherUserId || sending) return;

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id: otherUserId, body: messageText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send message");
        return;
      }
      setMessageText("");
      const [msgRes, convRes] = await Promise.all([
        fetch(`/api/messages?with=${otherUserId}`),
        fetch("/api/messages"),
      ]);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(msgData.messages || []);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      if (convRes.ok) {
        const convData = await convRes.json();
        setConversations(convData.conversations || []);
      }
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  if (!session) return null;

  const otherUser = conversations.find((c) => c.other_user_id === otherUserId);
  const otherName = otherUser?.other_user_name || "Founder";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <Link
          href="/messages"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; all messages
        </Link>
      </div>

      <div className="grid gap-px border border-border/30 sm:grid-cols-[280px_1fr]" style={{ minHeight: 500 }}>
        {/* Conversation list */}
        <div className="hidden sm:block border-r border-border/30 bg-card/20">
          <div className="p-3 border-b border-border/20">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Conversations
            </p>
          </div>
          {conversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {conversations.map((conv) => (
                <Link
                  key={conv.other_user_id}
                  href={`/messages/${conv.other_user_id}`}
                  className={cn(
                    "flex items-center gap-3 p-3 transition-colors",
                    otherUserId === conv.other_user_id
                      ? "bg-fire/5 border-l-2 border-l-fire"
                      : "hover:bg-panel/30"
                  )}
                >
                  <Avatar src={conv.other_user_image} name={conv.other_user_name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {conv.other_user_name || "Anonymous"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {conv.sender_id === session.user?.id ? "You: " : ""}
                      {conv.body}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(conv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {!conv.read_at && conv.sender_id !== session.user?.id && (
                      <span className="h-2 w-2 rounded-full bg-fire" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Message area */}
        <div className="flex flex-col bg-card/10">
          <div className="flex items-center gap-3 border-b border-border/30 p-4">
            <button
              onClick={() => router.push("/messages")}
              className="flex sm:hidden items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Avatar src={otherUser?.other_user_image} name={otherName} size={32} />
            <p className="font-semibold">{otherName}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 480 }}>
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MailOpen className="mx-auto h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Start the conversation
                  </p>
                </div>
              </div>
            )}
            {messages.map((msg) => {
              const isOwn = msg.sender_id === session.user?.id;
              return (
                <div
                  key={msg.id}
                  className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-none px-3 py-2",
                      isOwn
                        ? "bg-fire/10 border border-fire/20 text-foreground"
                        : "bg-card/50 border border-border/30 text-foreground"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                    <p className={cn(
                      "text-[10px] mt-1",
                      isOwn ? "text-fire/60 text-right" : "text-muted-foreground"
                    )}>
                      {new Date(msg.created_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <p className="px-4 py-1 text-xs text-red-400">{error}</p>
          )}

          <form onSubmit={handleSend} className="flex gap-2 border-t border-border/30 p-3">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-none border border-border/40 bg-background px-3 py-2 text-sm outline-none focus:border-fire/50"
              disabled={sending}
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              className="flex items-center gap-1 rounded-none btn-fire bg-fire px-3 py-2 text-xs font-bold uppercase tracking-wider text-fire-foreground hover:bg-fire/90 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}