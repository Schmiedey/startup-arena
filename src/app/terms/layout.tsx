import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Terms of Service",
  description: "Terms of Service for Likelyr.",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
