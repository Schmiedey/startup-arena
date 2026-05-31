import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Founders",
  description: "Ranking of Likelyr founders by karma score.",
};

export default function FoundersLayout({ children }: { children: React.ReactNode }) {
  return children;
}