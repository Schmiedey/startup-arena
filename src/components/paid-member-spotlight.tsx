"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CATEGORY_COLORS } from "@/lib/types";
import { founderPath } from "@/lib/seo";
import { trackClientEvent } from "@/lib/analytics-client";

interface FeaturedMember {
  id: string;
  name: string | null;
  image: string | null;
  plan: "launch" | "pro";
  profile_headline: string | null;
  profile_bio: string | null;
  profile_cta_label: string | null;
  profile_cta_url: string | null;
  profile_featured_category: string | null;
  profile_weekly_digest_opt_in: boolean | null;
  idea_id: string | null;
  idea_name: string | null;
  idea_pitch: string | null;
  idea_category: string | null;
  idea_stage: string | null;
  idea_elo_score: number | string | null;
  ideas_count: number | string;
  best_elo: number | string;
  total_wins: number | string;
  total_losses: number | string;
}

interface PaidMemberSpotlightProps {
  category?: string | null;
  limit?: number;
  title?: string;
  compact?: boolean;
}

export function PaidMemberSpotlight({
  category,
  limit = 6,
  title = "Featured founders",
  compact = false,
}: PaidMemberSpotlightProps) {
  const [members, setMembers] = useState<FeaturedMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (category) params.set("category", category);

    fetch(`/api/featured-members?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load featured members");
        return res.json() as Promise<FeaturedMember[]>;
      })
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [category, limit]);

  useEffect(() => {
    members.forEach((member, index) => {
      trackClientEvent("paid_member_spotlight_impression", {
        member_user_id: member.id,
        idea_id: member.idea_id,
        category: category ?? "all",
        position: index + 1,
        plan: member.plan,
      });
    });
  }, [members, category]);

  if (loading) {
    return (
      <section className="mb-6 border border-border/30 bg-card/15 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-fire" />
          Loading featured founders
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6 border border-border/30 bg-card/15 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-fire/30 bg-fire/10 text-fire">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black uppercase tracking-widest">{title}</h2>
            {category && (
              <p className="text-xs text-muted-foreground">{category} slots</p>
            )}
          </div>
        </div>
        <Link
          href="/founders"
          className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-fire"
        >
          All founders
        </Link>
      </div>

      {members.length === 0 ? (
        <div className="border border-dashed border-border/40 bg-background/25 px-4 py-5 text-center">
          <p className="text-sm font-semibold">No paid members featured yet.</p>
          <p className="mx-auto mt-1 max-w-xl text-xs text-muted-foreground">
            Paid founders will appear here with profile links, CTAs, and category visibility once they upgrade.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex items-center justify-center border border-fire/35 px-3 py-2 text-xs font-bold uppercase tracking-wider text-fire transition-colors hover:bg-fire/10"
          >
            Become featured
          </Link>
        </div>
      ) : (
      <div className={compact ? "grid gap-2 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
        {members.map((member, index) => {
          const name = member.name || "Anonymous founder";
          const profileHref = founderPath({ id: member.id, name: member.name });
          const headline = member.profile_headline || member.idea_pitch || "Featured paid member";
          const recordTotal = Number(member.total_wins) + Number(member.total_losses);
          const winRate = recordTotal > 0 ? Math.round((Number(member.total_wins) / recordTotal) * 100) : 0;
          const displayCategory = member.idea_category || member.profile_featured_category;

          return (
            <div key={`${member.id}-${member.idea_id ?? "profile"}`} className="border border-border/25 bg-background/35 p-3">
              <div className="flex items-start gap-3">
                <Avatar src={member.image} name={name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={profileHref}
                      onClick={() => {
                        trackClientEvent("paid_member_spotlight_clicked", {
                          member_user_id: member.id,
                          idea_id: member.idea_id,
                          category: category ?? "all",
                          position: index + 1,
                        });
                      }}
                      className="truncate text-sm font-bold transition-colors hover:text-fire"
                    >
                      {name}
                    </Link>
                    <span className="inline-flex items-center gap-1 border border-fire/30 bg-fire/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fire">
                      <Crown className="h-2.5 w-2.5" />
                      {member.plan === "pro" ? "Pro" : "Launch"}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{headline}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {displayCategory && (
                  <span className={`${CATEGORY_COLORS[displayCategory] ?? ""} px-1.5 py-0.5 text-[10px] font-semibold`}>
                    {displayCategory}
                  </span>
                )}
                {member.idea_elo_score ? (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{member.idea_elo_score} Elo</span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Profile featured</span>
                )}
                {recordTotal > 0 && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{winRate}% win</span>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  href={profileHref}
                  onClick={() => {
                    trackClientEvent("paid_member_spotlight_clicked", {
                      member_user_id: member.id,
                      idea_id: member.idea_id,
                      category: category ?? "all",
                      position: index + 1,
                    });
                  }}
                  className="inline-flex flex-1 items-center justify-center border border-border/40 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-fire/30 hover:text-fire"
                >
                  Profile
                </Link>
                {member.profile_cta_url && (
                  <a
                    href={member.profile_cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackClientEvent("profile_cta_clicked", {
                        profile_user_id: member.id,
                        idea_id: member.idea_id,
                        source: "paid_member_spotlight",
                      });
                    }}
                    className="inline-flex items-center justify-center gap-1 border border-fire/35 bg-fire/10 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-fire transition-colors hover:bg-fire/15"
                  >
                    {member.profile_cta_label || "Visit"}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
