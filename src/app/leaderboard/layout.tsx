import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See which ideas rank highest on Likelyr's Elo-rated leaderboard.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
