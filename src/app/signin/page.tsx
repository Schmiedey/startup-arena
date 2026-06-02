"use client";

import { signIn } from "next-auth/react";
import { LikelyrLogo } from "@/components/likelyr-logo";
import Link from "next/link";
import { useEffect, useState } from "react";
import { safeAuthRedirect } from "@/lib/auth-redirect";

const emailAuthEnabled = process.env.NEXT_PUBLIC_EMAIL_AUTH_ENABLED === "true";

type Mode = "signin" | "signup" | "forgot";
type OAuthProvider = "github" | "google";

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const verified = searchParams.get("verified");
    const message =
      verified === "1"
        ? "Email verified. You can sign in now."
        : verified === "0"
          ? "That verification link is invalid or expired."
      : null;
    if (message) window.setTimeout(() => setStatus(message), 0);
  }, []);

  function currentCallbackUrl() {
    const searchParams = new URLSearchParams(window.location.search);
    return safeAuthRedirect(searchParams.get("callbackUrl"), window.location.origin);
  }

  async function handleOAuthSignIn(provider: OAuthProvider) {
    if (submitting) return;
    setSubmitting(true);
    setStatus(null);

    try {
      await signIn(provider, { redirectTo: currentCallbackUrl() });
    } catch {
      setSubmitting(false);
      setStatus("Could not start sign in. Please try again.");
    }
  }

  async function handlePasswordSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirectTo: currentCallbackUrl(),
      redirect: false,
    });

    setSubmitting(false);
    if (result?.ok && result.url) {
      window.location.href = result.url;
      return;
    }
    setStatus("Could not sign in. Check your password and make sure your email is verified.");
  }

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const result = await response.json().catch(() => ({}));

    setSubmitting(false);
    setStatus(response.ok ? "Check your email to verify your account." : result.error ?? "Could not create account.");
  }

  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setSubmitting(false);
    setStatus("If that email has a password account, a reset link has been sent.");
  }

  async function handleEmailSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const result = await signIn("email", {
      email,
      redirectTo: currentCallbackUrl(),
      redirect: false,
    });

    setSubmitting(false);
    setStatus(result?.error ? "Email sign-in is not configured yet." : "Check your email for a sign-in link.");
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-fire/10">
            <LikelyrLogo className="h-6 w-6 text-fire" />
          </div>
          <h1 className="text-2xl font-black">sign in to Likelyr</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            sign in to submit ideas, vote, and climb the ranks.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuthSignIn("github")}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 rounded-none border border-border/60 bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-panel hover:border-fire/30 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            {submitting ? "Starting sign in..." : "Continue with GitHub"}
          </button>

          <button
            type="button"
            onClick={() => handleOAuthSignIn("google")}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 rounded-none border border-border/60 bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-panel hover:border-fire/30 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {submitting ? "Starting sign in..." : "Continue with Google"}
          </button>

          {emailAuthEnabled && (
            <>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 text-xs uppercase tracking-widest text-muted-foreground">or</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {(["signin", "signup", "forgot"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setMode(item);
                      setStatus(null);
                    }}
                    className={`border border-border/60 px-2 py-2 text-xs font-semibold transition-colors ${
                      mode === item ? "bg-fire text-white" : "bg-card text-muted-foreground hover:bg-panel"
                    }`}
                  >
                    {item === "signin" ? "Sign in" : item === "signup" ? "Create" : "Reset"}
                  </button>
                ))}
              </div>

              {mode === "signin" && (
                <form onSubmit={handlePasswordSignIn} className="space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-none border border-border/60 bg-card px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-fire/40"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    required
                    className="w-full rounded-none border border-border/60 bg-card px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-fire/40"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center rounded-none border border-border/60 bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-panel hover:border-fire/30 disabled:opacity-60"
                  >
                    {submitting ? "Signing in..." : "Sign in with password"}
                  </button>
                </form>
              )}

              {mode === "signup" && (
                <form onSubmit={handleSignup} className="space-y-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Display name"
                    className="w-full rounded-none border border-border/60 bg-card px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-fire/40"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-none border border-border/60 bg-card px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-fire/40"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password with a letter and number"
                    required
                    minLength={8}
                    className="w-full rounded-none border border-border/60 bg-card px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-fire/40"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center rounded-none border border-border/60 bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-panel hover:border-fire/30 disabled:opacity-60"
                  >
                    {submitting ? "Creating..." : "Create account"}
                  </button>
                </form>
              )}

              {mode === "forgot" && (
                <form onSubmit={handleForgotPassword} className="space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-none border border-border/60 bg-card px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-fire/40"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center rounded-none border border-border/60 bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-panel hover:border-fire/30 disabled:opacity-60"
                  >
                    {submitting ? "Sending..." : "Send reset link"}
                  </button>
                </form>
              )}

              <form onSubmit={handleEmailSignIn} className="space-y-2 border-t border-border/30 pt-3">
                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="flex w-full items-center justify-center rounded-none border border-border/60 bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-panel hover:border-fire/30 disabled:opacity-60"
                >
                  Email me a sign-in link
                </button>
              </form>

              {status && <p className="text-center text-xs text-muted-foreground">{status}</p>}
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          by signing in you agree to our{" "}
          <Link href="/terms" className="text-fire hover:underline">terms</Link> and{" "}
          <Link href="/privacy" className="text-fire hover:underline">privacy policy</Link>.
          we only use your email for auth.
        </p>
      </div>
    </div>
  );
}
