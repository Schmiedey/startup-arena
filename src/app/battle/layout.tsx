import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Startup idea battles",
  description:
    "Vote on head-to-head startup idea battles and see which business ideas the crowd thinks are more likely to make money.",
  path: "/battle",
});

export default function BattleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
