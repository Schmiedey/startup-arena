import type { Metadata } from "next";
import { createMetadata, noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Edit idea",
  description: "Edit a Likelyr idea.",
  path: "/idea/edit",
  robots: noIndexRobots(),
});

export default function EditIdeaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
