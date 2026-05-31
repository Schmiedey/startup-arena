import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Likelyr.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}