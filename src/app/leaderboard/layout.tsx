import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Startup idea leaderboard",
  description:
    "Explore Likelyr's Elo-rated startup idea leaderboard and see which business ideas are winning real head-to-head votes.",
  path: "/leaderboard",
});

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
