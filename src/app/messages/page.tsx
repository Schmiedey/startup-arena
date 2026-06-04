"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
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

export default function MessagesInboxPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
      return;
    }
    if (status !== "authenticated") return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/messages");
        if (!res.ok) return;
        const data = await res.json();
        if (active) setConversations(data.conversations || []);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch {
        // ignore
      }
    }, 15000);
    return () => clearInterval(id);
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-black font-[family-name:var(--font-chakra)] mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground/20" />
            <p className="mt-4 text-lg font-semibold">No conversations yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Visit a founder&apos;s profile to start a conversation
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.other_user_id}
              onClick={() => router.push(`/messages/${conv.other_user_id}`)}
              className={cn(
                "flex w-full items-center gap-4 border border-border/20 bg-card/10 px-4 py-3 text-left transition-colors hover:bg-panel/20 hover:border-fire/20"
              )}
            >
              <Avatar src={conv.other_user_image} name={conv.other_user_name} size={40} />
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}