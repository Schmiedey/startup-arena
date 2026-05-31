import type { Metadata } from "next";
import { getShareBattle } from "@/lib/share-data";

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

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function BattleLayout({ children }: BattleLayoutProps) {
  return children;
}
