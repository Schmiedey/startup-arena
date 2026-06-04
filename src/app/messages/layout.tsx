import type { Metadata } from "next";
import { createMetadata, noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Messages",
  description: "Connect with other founders on Likelyr.",
  path: "/messages",
  robots: noIndexRobots(),
});

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}