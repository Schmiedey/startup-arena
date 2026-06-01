import type { Metadata } from "next";
import { createMetadata, noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Admin",
  description: "Likelyr admin tools.",
  path: "/admin",
  robots: noIndexRobots(),
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
