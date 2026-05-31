import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Chakra_Petch } from "next/font/google";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsTracker } from "@/components/analytics-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "https://likelyr.com"),
  title: {
    default: "Likelyr — Find what's likelier to succeed",
    template: "%s — Likelyr",
  },
  description:
    "Battle ideas head-to-head and let the crowd decide what's likelier to succeed.",
  openGraph: {
    title: "Likelyr — Find what's likelier to succeed",
    description:
      "Battle ideas head-to-head and let the crowd decide what's likelier to succeed.",
    url: "https://likelyr.com",
    siteName: "Likelyr",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Likelyr — Find what's likelier to succeed",
    description:
      "Battle ideas head-to-head and let the crowd decide what's likelier to succeed.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${chakraPetch.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SessionProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border/30 py-8 text-center">
              <div className="mx-auto max-w-5xl px-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground/50">Likelyr — find what is likelier to succeed</p>
                <nav className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground/60">
                  <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
                  <span>·</span>
                  <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
                  <span>·</span>
                  <a href="https://x.com/likelyr" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">X / Twitter</a>
                </nav>
              </div>
            </footer>
            <Suspense fallback={null}>
              <AnalyticsTracker />
            </Suspense>
            <Analytics />
            <SpeedInsights />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
