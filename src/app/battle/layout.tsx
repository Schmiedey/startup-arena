import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Battle",
  description: "Vote head-to-head: which idea is more likely to succeed?",
};

export default function BattleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
