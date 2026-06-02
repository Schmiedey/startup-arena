"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LikelyrLogo } from "@/components/likelyr-logo";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(token ? null : "That reset link is missing a token.");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const result = await response.json().catch(() => ({}));
    setSubmitting(false);
    setStatus(response.ok ? "Password reset. You can sign in now." : result.error ?? "Could not reset password.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="New password"
        required
        minLength={8}
        className="w-full rounded-none border border-border/60 bg-card px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-fire/40"
      />
      <button
        type="submit"
        disabled={submitting || !token}
        className="flex w-full items-center justify-center rounded-none border border-border/60 bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-panel hover:border-fire/30 disabled:opacity-60"
      >
        {submitting ? "Resetting..." : "Reset password"}
      </button>
      {status && <p className="text-center text-xs text-muted-foreground">{status}</p>}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-none bg-fire/10">
            <LikelyrLogo className="h-6 w-6 text-fire" />
          </div>
          <h1 className="text-2xl font-black">reset password</h1>
          <p className="mt-2 text-sm text-muted-foreground">choose a new password for your Likelyr account.</p>
        </div>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/signin" className="text-fire hover:underline">back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
