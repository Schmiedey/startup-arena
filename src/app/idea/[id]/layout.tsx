import type { Metadata } from "next";
import { getShareIdea, ideaShareDescription } from "@/lib/share-data";

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
  const description = ideaShareDescription(idea);

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

export default function IdeaLayout({ children }: IdeaLayoutProps) {
  return children;
}
