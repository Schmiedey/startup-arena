import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Likelyr to submit ideas and vote in battles.",
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
