import type { Metadata } from "next";

export const SITE_NAME = "Likelyr";
export const SITE_URL = "https://likelyr.com";
export const DEFAULT_TITLE = "Likelyr - Startup idea validation by real votes";
export const DEFAULT_DESCRIPTION =
  "Submit startup ideas, vote in head-to-head battles, and use crowd rankings to see which ideas are likelier to make money.";

export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Likelyr startup idea validation battles",
};

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized === "/" ? "" : normalized}`;
}

export function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function truncateDescription(value: string, maxLength = 155): string {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function slugify(value: string | null | undefined, fallback = "page"): string {
  const slug = (value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug || fallback;
}

export function extractEntityId(value: string): string {
  const uuidMatch = value.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
  );
  return uuidMatch?.[0] ?? value;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function ideaPath(idea: { id: string; name: string }): string {
  return `/idea/${idea.id}-${slugify(idea.name, "startup-idea")}`;
}

export function founderPath(founder: { id: string; name?: string | null }): string {
  return `/founder/${founder.id}-${slugify(founder.name, "founder")}`;
}

export function battlePath(battle: {
  id: string;
  idea_a: { name: string };
  idea_b: { name: string };
}): string {
  const matchup = `${battle.idea_a.name} vs ${battle.idea_b.name}`;
  return `/battle/${battle.id}-${slugify(matchup, "startup-idea-battle")}`;
}

interface CreateMetadataOptions {
  title: string;
  description: string;
  path: string;
  image?: typeof DEFAULT_OG_IMAGE;
  robots?: Metadata["robots"];
}

export function createMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  robots,
}: CreateMetadataOptions): Metadata {
  const fullTitle = `${title} - ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image.url],
    },
    robots,
  };
}

export function noIndexRobots(): Metadata["robots"] {
  return {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  };
}

export const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl("/icon.png"),
      sameAs: ["https://x.com/likelyr"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: DEFAULT_DESCRIPTION,
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      inLanguage: "en-US",
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: DEFAULT_DESCRIPTION,
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "Launch Pass",
          price: "19",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "Founder Pro",
          price: "12",
          priceCurrency: "USD",
        },
      ],
      audience: {
        "@type": "Audience",
        audienceType: "Startup founders, indie hackers, and product builders",
      },
    },
  ],
};
