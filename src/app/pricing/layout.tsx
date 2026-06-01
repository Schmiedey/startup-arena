import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Pricing",
  description:
    "Compare Likelyr plans for startup idea validation, challenge links, feedback loops, and founder testing.",
  path: "/pricing",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
