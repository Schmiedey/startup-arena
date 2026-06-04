"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Mail } from "lucide-react";

export function MessageUserButton({ userId, size = "sm" }: { userId: string; size?: "sm" | "xs" }) {
  const { data: session } = useSession();
  if (!session?.user?.id || session.user.id === userId) return null;

  if (size === "xs") {
    return (
      <Link
        href={`/messages/${userId}`}
        className="inline-flex items-center justify-center text-muted-foreground hover:text-fire transition-colors"
        title="Message"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
      >
        <Mail className="h-3 w-3" />
      </Link>
    );
  }

  return (
    <Link
      href={`/messages/${userId}`}
      className="inline-flex items-center gap-1 rounded-none border border-fire/30 bg-fire/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-fire transition-colors hover:bg-fire/10"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
    >
      <Mail className="h-3 w-3" />
      Message
    </Link>
  );
}