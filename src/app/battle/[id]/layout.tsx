import type { Metadata } from "next";
import { getShareBattle } from "@/lib/share-data";
import { JsonLd } from "@/components/json-ld";
import {
  SITE_NAME,
  absoluteUrl,
  battlePath,
  ideaPath,
  truncateDescription,
} from "@/lib/seo";

interface BattleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BattleLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const battle = await getShareBattle(id);

  if (!battle) {
    return {
      title: "Likelyr battle",
      description: "Vote on an idea battle in Likelyr.",
    };
  }

  const title = battle.winner && battle.loser
    ? `${battle.winner.name} beat ${battle.loser.name}`
    : `${battle.idea_a.name} vs ${battle.idea_b.name}`;
  const description = battle.winner && battle.loser
    ? `Think the crowd got it wrong? Vote on ${battle.winner.name} vs ${battle.loser.name}.`
    : `Which idea is more likely to succeed: ${battle.idea_a.name} or ${battle.idea_b.name}?`;
  const path = battlePath(battle);
  const image = {
    url: `${path}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: `${battle.idea_a.name} vs ${battle.idea_b.name} on ${SITE_NAME}`,
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
      publishedTime: battle.created_at,
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

export default async function BattleLayout({ children, params }: BattleLayoutProps) {
  const { id } = await params;
  const battle = await getShareBattle(id);

  if (!battle) return children;

  const path = battlePath(battle);
  const title = battle.winner && battle.loser
    ? `${battle.winner.name} beat ${battle.loser.name}`
    : `${battle.idea_a.name} vs ${battle.idea_b.name}`;
  const description = battle.winner && battle.loser
    ? `Likelyr voters picked ${battle.winner.name} over ${battle.loser.name} in a startup idea battle.`
    : `Vote on whether ${battle.idea_a.name} or ${battle.idea_b.name} is more likely to succeed.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl(path)}#webpage`,
    name: title,
    description: truncateDescription(description),
    url: absoluteUrl(path),
    datePublished: battle.created_at,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    about: [
      {
        "@type": "CreativeWork",
        name: battle.idea_a.name,
        url: absoluteUrl(ideaPath(battle.idea_a)),
      },
      {
        "@type": "CreativeWork",
        name: battle.idea_b.name,
        url: absoluteUrl(ideaPath(battle.idea_b)),
      },
    ],
    mainEntity: {
      "@type": "VoteAction",
      name: "Startup idea battle vote",
      object: `${battle.idea_a.name} vs ${battle.idea_b.name}`,
      result: battle.winner?.name,
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  );
}
