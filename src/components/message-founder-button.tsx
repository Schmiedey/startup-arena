"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Mail } from "lucide-react";

export function MessageFounderButton({ founderUserId }: { founderUserId: string; founderName: string }) {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session?.user?.id) return null;
  if (session.user.id === founderUserId) return null;

  return (
    <Link
      href={`/messages/${founderUserId}`}
      className="inline-flex items-center gap-1.5 rounded-none border border-fire/30 bg-fire/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-fire transition-colors hover:bg-fire/10 hover:border-fire/50"
    >
      <Mail className="h-3.5 w-3.5" />
      Message
    </Link>
  );
}