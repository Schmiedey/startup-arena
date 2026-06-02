import type { Metadata } from "next";
import { createMetadata, noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Reset password",
  description: "Reset your Likelyr password.",
  path: "/reset-password",
  robots: noIndexRobots(),
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
