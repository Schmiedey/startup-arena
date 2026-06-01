import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Founder rankings",
  description:
    "Find founders testing startup ideas on Likelyr, ranked by idea submissions, battle wins, votes cast, and karma.",
  path: "/founders",
});

export default function FoundersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
