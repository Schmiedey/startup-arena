import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Chakra_Petch } from "next/font/google";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ChatWidget } from "@/components/chat-widget";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { JsonLd } from "@/components/json-ld";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  siteJsonLd,
} from "@/lib/seo";

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
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_TITLE,
    template: `%s - ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "startup ideas",
    "startup validation",
    "idea validation",
    "business ideas",
    "startup rankings",
    "startup leaderboard",
    "founder feedback",
    "Elo rankings",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Startup validation",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("likelyr-theme");if(t==="light"){document.documentElement.classList.remove("dark")}else if(t==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SessionProvider>
            <JsonLd data={siteJsonLd} />
            <Navbar />
            <main className="flex-1">{children}</main>
            <ChatWidget />
            <footer className="border-t border-border/30 py-8 text-center">
              <div className="mx-auto max-w-5xl px-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground/50">Likelyr - startup idea validation by real votes</p>
                <nav className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-muted-foreground/60">
                  <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                  <span>·</span>
                  <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
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
