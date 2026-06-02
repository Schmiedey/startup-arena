"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-6xl font-black text-red-500">!</div>
      <h1 className="mb-2 text-2xl font-black">something broke</h1>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Try again or head back to Likelyr.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 border border-fire px-6 py-3 text-sm font-bold uppercase tracking-wider text-fire hover:bg-fire/10 transition-colors"
        >
          try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 btn-fire bg-fire px-6 py-3 text-sm font-bold uppercase tracking-wider text-fire-foreground hover:bg-fire/90"
        >
          home
        </Link>
      </div>
    </div>
  );
}
