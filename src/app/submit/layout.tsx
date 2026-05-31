import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Idea",
  description: "Submit your idea to Likelyr and let the internet vote on it.",
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
