import type { Metadata } from "next";
import { createMetadata, noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Admin Settings",
  description: "Admin settings for Likelyr.",
  path: "/admin/settings",
  robots: noIndexRobots(),
});

export default function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}