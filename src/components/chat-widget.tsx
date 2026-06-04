"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { X, Send, Loader2, Mail, MailOpen, ChevronLeft, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

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

type View = "closed" | "conversations" | "chat";

export function ChatWidget() {
  const { data: session, status } = useSession();
  const [view, setView] = useState<View>("closed");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState<string | null>(null);
  const [activeChatImage, setActiveChatImage] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    }
  }, []);

  const loadMessages = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/messages?with=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/messages");
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          setConversations(data.conversations || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // ignore
      }
    })();
    return () => { active = false; };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (view === "closed") return;
    const id = setInterval(() => {
      loadConversations();
      if (activeChat) loadMessages(activeChat);
    }, 8000);
    return () => clearInterval(id);
  }, [status, view, activeChat, loadConversations, loadMessages]);

  async function openChat(userId: string, userName: string | null, userImage: string | null) {
    setActiveChat(userId);
    setActiveChatName(userName);
    setActiveChatImage(userImage);
    setView("chat");
    setMessageText("");
    setError("");
    await loadMessages(userId);
    void loadConversations();
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || !activeChat || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id: activeChat, body: messageText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send");
        return;
      }
      setMessageText("");
      await loadMessages(activeChat);
      await loadConversations();
    } catch {
      setError("Failed to send");
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setView("closed");
    setActiveChat(null);
    setMessageText("");
    setError("");
  }

  if (status !== "authenticated" || !session?.user) return null;

  return (
    <>
      {/* Floating bubble */}
      {view === "closed" && (
        <button
          onClick={() => { setView("conversations"); loadConversations(); }}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-fire/30 bg-fire shadow-lg shadow-fire/20 transition-transform hover:scale-105 active:scale-95"
          aria-label="Open messages"
        >
          <MessageSquare className="h-6 w-6 text-fire-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-fire px-1.5 text-[10px] font-bold text-fire-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {view !== "closed" && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[480px] w-[360px] flex-col border border-border/40 bg-background shadow-2xl sm:bottom-6 sm:right-6 max-[400px]:inset-0 max-[400px]:h-full max-[400px]:w-full max-[400px]:rounded-none max-[400px]:border-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
            {view === "chat" ? (
              <button
                onClick={() => { setView("conversations"); setActiveChat(null); }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Back</span>
              </button>
            ) : (
              <h3 className="text-sm font-bold uppercase tracking-wider">Messages</h3>
            )}
            <button
              onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {view === "conversations" && (
              <div className="h-full overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-6">
                    <div className="text-center">
                      <Mail className="mx-auto h-8 w-8 text-muted-foreground/20" />
                      <p className="mt-3 text-sm font-semibold">No conversations</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Visit a founder&apos;s profile to start messaging
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {conversations.map((conv) => (
                      <button
                        key={conv.other_user_id}
                        onClick={() => openChat(conv.other_user_id, conv.other_user_name, conv.other_user_image)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-panel/30"
                      >
                        <Avatar src={conv.other_user_image} name={conv.other_user_name} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {conv.other_user_name || "Anonymous"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {conv.sender_id === session?.user?.id ? "You: " : ""}
                            {conv.body}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(conv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          {!conv.read_at && conv.sender_id !== session?.user?.id && (
                            <span className="h-2 w-2 rounded-full bg-fire" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === "chat" && activeChat && (
              <div className="flex h-full flex-col">
                {/* Chat header */}
                <div className="flex items-center gap-2 border-b border-border/20 px-4 py-2">
                  <Avatar src={activeChatImage} name={activeChatName} size={28} />
                  <span className="text-sm font-semibold truncate">{activeChatName || "Founder"}</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {messages.length === 0 && (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <MailOpen className="mx-auto h-6 w-6 text-muted-foreground/20" />
                        <p className="mt-2 text-xs text-muted-foreground">Start the conversation</p>
                      </div>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === session?.user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-sm px-3 py-1.5",
                            isOwn
                              ? "bg-fire/10 border border-fire/15 text-foreground"
                              : "bg-card/50 border border-border/25 text-foreground"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-snug">{msg.body}</p>
                          <p className={cn(
                            "text-[9px] mt-0.5",
                            isOwn ? "text-fire/50 text-right" : "text-muted-foreground"
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

                {error && <p className="px-4 py-1 text-xs text-red-400">{error}</p>}

                {/* Send form */}
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
                    className="flex items-center justify-center rounded-none btn-fire bg-fire px-3 py-2 text-fire-foreground hover:bg-fire/90 disabled:opacity-40"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}