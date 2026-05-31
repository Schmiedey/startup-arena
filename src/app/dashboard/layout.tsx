import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your ideas and profile on Likelyr.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
