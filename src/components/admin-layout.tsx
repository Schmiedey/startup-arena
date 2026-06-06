"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, LayoutDashboard, Users, Lightbulb, MessageSquare, Vote, Loader2, Mail, Send, Settings } from "lucide-react";

const tabs = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/admin/votes", label: "Votes", icon: Vote },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/email", label: "Email", icon: Send },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/signin");
      return;
    }
    async function check() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    }
    check();
  }, [session, status, router]);

  if (status === "loading" || checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black font-[family-name:var(--font-chakra)]">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">manage everything. you have the power.</p>
      </div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border/30">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
              pathname === href
                ? "border-fire text-fire"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
