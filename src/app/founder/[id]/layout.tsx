import type { Metadata } from "next";
import { founderShareDescription, getShareFounder } from "@/lib/share-data";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  founderPath,
  truncateDescription,
} from "@/lib/seo";

interface FounderLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FounderLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const founder = await getShareFounder(id);

  if (!founder) {
    return {
      title: "Founder not found",
    };
  }

  const displayName = founder.name ?? "Anonymous founder";
  const title = `${displayName} founder profile`;
  const description = truncateDescription(founderShareDescription(founder));
  const path = founderPath(founder);

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${title} - ${SITE_NAME}`,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "profile",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - ${SITE_NAME}`,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

export default function FounderLayout({ children }: FounderLayoutProps) {
  return children;
}
