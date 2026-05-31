"use client";

import { useSession } from "next-auth/react";
import { Comment } from "@/lib/types";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageCircle, Loader2, Flag } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { trackClientEvent } from "@/lib/analytics-client";

const COMMENT_PROMPTS = [
  "Why would this win?",
  "What would kill this idea?",
  "Would you pay for this?",
  "What should the founder change?",
];

interface CommentSectionProps {
  ideaId: string;
  comments: Comment[];
}

export function CommentSection({ ideaId, comments: initialComments }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagging, setFlagging] = useState<string | null>(null);

  async function handleSubmit() {
    if (!body.trim()) return;
    if (!session?.user) {
      window.location.href = "/signin";
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea_id: ideaId, body }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [comment, ...prev]);
        setBody("");
        trackClientEvent("comment_posted", { idea_id: ideaId });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to post comment.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFlag(commentId: string) {
    if (flagging) return;
    setFlagging(commentId);
    try {
      const res = await fetch("/api/comments/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, flag_count: data.flag_count } : c));
      }
    } catch { /* silent */ } finally {
      setFlagging(null);
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-4">
      {!session?.user && (
        <p className="text-xs text-muted-foreground">
          <Link href="/signin" className="text-fire hover:underline">Sign in</Link> to comment.
        </p>
      )}

      {session?.user && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {COMMENT_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setBody(prompt + " ")}
                className="rounded-full border border-border/60 bg-panel/30 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-fire/30 hover:text-fire"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Drop your take..."
              className="min-h-[72px] flex-1 resize-none bg-background/30 border-border/50 text-sm"
            />
            <Button
              onClick={handleSubmit}
              disabled={submitting || !body.trim()}
              className="self-end bg-fire text-fire-foreground hover:bg-fire/90"
              size="icon"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </>
      )}

      <div className="space-y-2.5">
        {comments.length === 0 && (
          <div className="py-6 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">
              No takes yet. Be the first to weigh in.
            </p>
          </div>
        )}
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-lg border border-border/40 bg-card/30 p-3"
          >
            <div className="mb-1 flex items-center gap-2">
              <Avatar src={comment.user_image} name={comment.user_name} size={16} />
              <span className="text-xs font-semibold">{comment.user_name ?? "Anonymous"}</span>
              <span className="text-[10px] text-muted-foreground">{formatDate(comment.created_at)}</span>
            </div>
            <p className="text-sm leading-relaxed">{comment.body}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <button
                onClick={() => handleFlag(comment.id)}
                disabled={flagging === comment.id}
                className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-red-400 transition-colors disabled:opacity-50"
                title="Report this comment"
              >
                <Flag className="h-2.5 w-2.5" />
                {(comment.flag_count && comment.flag_count > 0) ? `flagged ${comment.flag_count}x` : "report"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
