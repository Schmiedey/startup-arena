import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-6xl font-black text-fire">404</div>
      <h1 className="mb-2 text-2xl font-black">page not found</h1>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        This page doesn&apos;t exist or has been removed. Head back to Likelyr.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 btn-fire bg-fire px-6 py-3 text-sm font-bold uppercase tracking-wider text-fire-foreground hover:bg-fire/90"
      >
        return to Likelyr
      </Link>
    </div>
  );
}
