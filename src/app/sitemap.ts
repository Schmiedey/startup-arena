import type { MetadataRoute } from "next";
import { sql } from "@vercel/postgres";
import { SITE_URL, battlePath, founderPath, ideaPath } from "@/lib/seo";

export const dynamic = "force-dynamic";

type DynamicRow = {
  id: string;
  name?: string | null;
  idea_a_name?: string;
  idea_b_name?: string;
  created_at: string | Date;
};

function asDate(value: string | Date, fallback: Date): Date {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function staticEntries(now: Date): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/leaderboard`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/battle`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/submit`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/founders`, lastModified: now, changeFrequency: "daily", priority: 0.65 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}

async function dynamicEntries(now: Date): Promise<MetadataRoute.Sitemap> {
  try {
    const [ideasResult, foundersResult, battlesResult] = await Promise.all([
      sql<DynamicRow>`
        SELECT id, name, created_at
        FROM ideas
        ORDER BY elo_score DESC, created_at DESC
        LIMIT 1000
      `,
      sql<DynamicRow>`
        SELECT u.id, u.name, u.created_at
        FROM users u
        WHERE u.name IS NOT NULL
          AND EXISTS (SELECT 1 FROM ideas i WHERE i.user_id = u.id)
        ORDER BY u.created_at DESC
        LIMIT 1000
      `,
      sql<DynamicRow>`
        SELECT
          b.id,
          a.name as idea_a_name,
          z.name as idea_b_name,
          b.created_at
        FROM battles b
        INNER JOIN ideas a ON a.id = b.idea_a_id
        INNER JOIN ideas z ON z.id = b.idea_b_id
        WHERE b.winner_id IS NOT NULL
        ORDER BY b.created_at DESC
        LIMIT 500
      `,
    ]);

    const ideas = ideasResult.rows.map((idea) => ({
      url: `${SITE_URL}${ideaPath({ id: idea.id, name: idea.name ?? "startup idea" })}`,
      lastModified: asDate(idea.created_at, now),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const founders = foundersResult.rows.map((founder) => ({
      url: `${SITE_URL}${founderPath(founder)}`,
      lastModified: asDate(founder.created_at, now),
      changeFrequency: "weekly" as const,
      priority: 0.55,
    }));

    const battles = battlesResult.rows.map((battle) => ({
      url: `${SITE_URL}${battlePath({
        id: battle.id,
        idea_a: { name: battle.idea_a_name ?? "Idea A" },
        idea_b: { name: battle.idea_b_name ?? "Idea B" },
      })}`,
      lastModified: asDate(battle.created_at, now),
      changeFrequency: "monthly" as const,
      priority: 0.45,
    }));

    return [...ideas, ...founders, ...battles];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  return [...staticEntries(now), ...(await dynamicEntries(now))];
}
