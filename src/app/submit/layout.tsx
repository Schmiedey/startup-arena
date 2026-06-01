import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Submit a startup idea",
  description:
    "Submit a startup idea to Likelyr and get fast crowd feedback through head-to-head idea battles.",
  path: "/submit",
});

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
