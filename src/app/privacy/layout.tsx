import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy",
  description: "Privacy Policy for Likelyr.",
  path: "/privacy",
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
