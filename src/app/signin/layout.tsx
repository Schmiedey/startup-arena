import type { Metadata } from "next";
import { createMetadata, noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Sign in",
  description: "Sign in to Likelyr to submit ideas and vote in battles.",
  path: "/signin",
  robots: noIndexRobots(),
});

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
