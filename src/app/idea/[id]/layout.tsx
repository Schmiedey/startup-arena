import type { Metadata } from "next";
import { getShareIdea, ideaShareDescription } from "@/lib/share-data";
import { JsonLd } from "@/components/json-ld";
import {
  SITE_NAME,
  absoluteUrl,
  founderPath,
  ideaPath,
  truncateDescription,
} from "@/lib/seo";

interface IdeaLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: IdeaLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const idea = await getShareIdea(id);

  if (!idea) {
    return {
      title: "Idea not found",
    };
  }

  const title = `${idea.name} survival rating`;
  const description = truncateDescription(ideaShareDescription(idea));
  const path = ideaPath(idea);
  const image = {
    url: `${path}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: `${idea.name} survival rating on ${SITE_NAME}`,
  };

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
      type: "article",
      publishedTime: idea.created_at,
      authors: idea.user_name ? [idea.user_name] : undefined,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - ${SITE_NAME}`,
      description,
      images: [image.url],
    },
  };
}

export default async function IdeaLayout({ children, params }: IdeaLayoutProps) {
  const { id } = await params;
  const idea = await getShareIdea(id);

  if (!idea) return children;

  const path = ideaPath(idea);
  const totalBattles = idea.wins + idea.losses;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${absoluteUrl(path)}#idea`,
    name: idea.name,
    description: truncateDescription(idea.pitch, 250),
    url: absoluteUrl(path),
    datePublished: idea.created_at,
    creator: idea.user_name
      ? {
          "@type": "Person",
          name: idea.user_name,
          url: idea.user_id ? absoluteUrl(founderPath({ id: idea.user_id, name: idea.user_name })) : undefined,
        }
      : undefined,
    genre: idea.category,
    keywords: [idea.category, idea.stage, "startup idea", "startup validation"],
    about: [
      {
        "@type": "Thing",
        name: idea.target_customer,
        description: idea.problem,
      },
      {
        "@type": "Thing",
        name: "Revenue model",
        description: idea.revenue_model,
      },
    ],
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "VoteAction" },
        userInteractionCount: totalBattles,
      },
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "LikeAction" },
        userInteractionCount: idea.wins,
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  );
}
