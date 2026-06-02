"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Trophy, Plus, Home, LogOut, LayoutDashboard, Sun, Moon, Users, Shield, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { Avatar } from "@/components/avatar";
import { LikelyrLogo } from "@/components/likelyr-logo";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/battle", label: "Battle", icon: Trophy },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/founders", label: "Founders", icon: Users },
  { href: "/submit", label: "Submit", icon: Plus },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setMobileMenuOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setDropdownOpen(false);
    setMobileMenuOpen(false);

    try {
      const result = await signOut({ redirect: false, redirectTo: "/" });
      window.location.assign(result.url || "/");
    } catch (error) {
      console.error("Sign out failed:", error);
      setSigningOut(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <LikelyrLogo className="h-5 w-5 text-fire transition-transform group-hover:scale-110" />
            <span className="text-sm font-black tracking-tight uppercase font-[family-name:var(--font-chakra)]">
              Like<span className="text-fire">lyr</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                    isActive ? "text-fire" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </Link>
              );
            })}

            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="ml-1 flex h-7 w-7 items-center justify-center rounded-none border border-border/30 text-muted-foreground transition-colors hover:bg-panel hover:text-foreground hover:border-fire/30"
              aria-label="Toggle theme"
            >
              <Sun className="hidden h-3.5 w-3.5 dark:block" />
              <Moon className="h-3.5 w-3.5 dark:hidden" />
            </button>

            {session?.user ? (
              <div className="relative ml-1" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border/50"
                >
                  <Avatar src={session.user.image} name={session.user.name} size={28} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-none border border-border/40 bg-card py-1 shadow-lg animate-slide-up">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-panel hover:text-foreground"
                    >
                      <LayoutDashboard className="h-3 w-3" />
                      Dashboard
                    </Link>
                    {session.user.isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-fire hover:bg-panel hover:text-foreground"
                      >
                        <Shield className="h-3 w-3" />
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-panel hover:text-foreground"
                    >
                      <LogOut className="h-3 w-3" />
                      {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/signin"
                className="ml-1 rounded-none btn-fire bg-fire px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-fire-foreground hover:bg-fire/90"
              >
                Sign in
              </Link>
            )}
          </nav>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden animate-fade-in" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav
            ref={mobileMenuRef}
            className="fixed top-0 right-0 bottom-0 w-72 bg-background border-l border-border/30 shadow-2xl overflow-y-auto animate-slide-in-right"
          >
            <div className="flex items-center justify-between px-6 h-12 border-b border-border/30">
              <span className="text-sm font-black tracking-tight uppercase font-[family-name:var(--font-chakra)]">
                Like<span className="text-fire">lyr</span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-1">
              {links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors",
                      isActive ? "text-fire bg-fire/5" : "text-muted-foreground hover:text-foreground hover:bg-panel"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-border/30 px-4 py-3">
              <button
                onClick={() => { setTheme(resolvedTheme === "dark" ? "light" : "dark"); }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <Sun className="hidden h-4 w-4 dark:block" />
                <Moon className="h-4 w-4 dark:hidden" />
                <span className="hidden dark:inline">Light mode</span>
                <span className="dark:hidden">Dark mode</span>
              </button>
            </div>

            <div className="border-t border-border/30 px-4 py-3">
              {session?.user ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar src={session.user.image} name={session.user.name} size={28} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{session.user.name}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-panel"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  {session.user.isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold uppercase tracking-wider text-fire hover:text-foreground hover:bg-panel"
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-panel"
                  >
                    <LogOut className="h-4 w-4" />
                    {signingOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              ) : (
                <Link
                  href="/signin"
                  className="flex items-center justify-center gap-2 w-full rounded-none btn-fire bg-fire px-4 py-3 text-sm font-bold uppercase tracking-wider text-fire-foreground hover:bg-fire/90"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
