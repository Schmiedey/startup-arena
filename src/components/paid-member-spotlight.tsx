"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, ChevronLeft, ChevronRight, ExternalLink, Loader2, Sparkles, TrendingUp, Swords, Zap } from "lucide-react";
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
  placement?: "section" | "bottom";
  variant?: "grid" | "carousel";
}

function formatNumber(value: number | string | null | undefined) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "0";
  return numberValue.toLocaleString();
}

function getWinRate(member: FeaturedMember) {
  const wins = Number(member.total_wins);
  const losses = Number(member.total_losses);
  const total = wins + losses;
  if (!Number.isFinite(total) || total <= 0) return null;
  return Math.round((wins / total) * 100);
}

function MemberCard({
  member,
  category,
  position,
  mode = "grid",
}: {
  member: FeaturedMember;
  category?: string | null;
  position: number;
  mode?: "carousel" | "grid";
}) {
  if (!member.idea_name) return null;

  const founderName = member.name || "Anonymous founder";
  const ideaName = member.idea_name;
  const showFounderName = founderName.toLowerCase() !== ideaName.toLowerCase();
  const profileHref = founderPath({ id: member.id, name: ideaName });
  const displayCategory = member.idea_category || member.profile_featured_category;
  const headline = member.idea_pitch || member.profile_headline || "Building something great";
  const winRate = getWinRate(member);
  const isCarousel = mode === "carousel";
  const categoryClass = displayCategory
    ? CATEGORY_COLORS[displayCategory] ?? "bg-card/25 text-muted-foreground"
    : "bg-card/25 text-muted-foreground";
  const isPro = member.plan === "pro";

  const handleClick = () => {
    trackClientEvent("paid_member_spotlight_clicked", {
      member_user_id: member.id,
      idea_id: member.idea_id,
      category: category ?? "all",
      position,
    });
  };

  return (
    <Link href={profileHref} onClick={handleClick} className="group block">
      <div
        className={`relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-card/80 via-card/50 to-panel/30 transition-all duration-300 hover:border-fire/30 hover:shadow-[0_0_40px_rgba(220,60,30,0.08)] ${
          isCarousel ? "p-6" : "p-5"
        }`}
      >
        {isPro && (
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fire/60 to-transparent" />
        )}

        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar src={member.image} name={ideaName} size={isCarousel ? 56 : 48} />
            {isPro && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-fire text-white shadow-lg shadow-fire/30">
                <Sparkles className="h-3 w-3" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold leading-tight text-foreground group-hover:text-fire transition-colors">
                {ideaName}
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isPro
                    ? "bg-fire/15 text-fire border border-fire/25"
                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                }`}
              >
                {isPro ? (
                  <>
                    <Sparkles className="h-2.5 w-2.5" />
                    Pro
                  </>
                ) : (
                  <>
                    <BadgeCheck className="h-2.5 w-2.5" />
                    Launch
                  </>
                )}
              </span>
            </div>

            {showFounderName && (
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                by {founderName}
              </p>
            )}

            <p className={`mt-2 leading-relaxed text-muted-foreground ${isCarousel ? "text-sm" : "text-xs"} line-clamp-2`}>
              {headline}
            </p>
          </div>

          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-fire" />
        </div>

        <div className={`mt-4 flex flex-wrap items-center gap-2 ${isCarousel ? "gap-3" : "gap-2"}`}>
          {displayCategory && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${categoryClass}`}>
              {displayCategory}
            </span>
          )}

          {member.idea_elo_score && Number(member.idea_elo_score) > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-panel/60 px-2.5 py-1 text-xs">
              <TrendingUp className="h-3 w-3 text-fire" />
              <span className="font-bold text-foreground">{formatNumber(member.idea_elo_score)}</span>
              <span className="text-muted-foreground">Elo</span>
            </div>
          )}

          {winRate !== null && (
            <div className="flex items-center gap-1 rounded-full bg-panel/60 px-2.5 py-1 text-xs">
              <Swords className="h-3 w-3 text-amber-400" />
              <span className="font-bold text-foreground">{winRate}%</span>
              <span className="text-muted-foreground">win</span>
            </div>
          )}

          {member.profile_cta_url && (
            <a
              href={member.profile_cta_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                trackClientEvent("profile_cta_clicked", {
                  profile_user_id: member.id,
                  idea_id: member.idea_id,
                  source: "paid_member_spotlight",
                });
              }}
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-fire/10 px-3 py-1 text-xs font-semibold text-fire transition-colors hover:bg-fire/20"
            >
              {member.profile_cta_label || "Visit"}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </Link>
  );
}

function PlanCard({ plan }: { plan: "launch" | "pro" | "free" }) {
    if (plan === "launch") {
      return (
        <div className="relative overflow-hidden rounded-xl border border-fire/20 bg-gradient-to-br from-fire/5 to-card/30 p-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fire/50 to-transparent" />
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fire/10">
              <Zap className="h-3.5 w-3.5 text-fire" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-fire">Launch Pass</span>
            <span className="ml-auto text-xs font-bold text-fire">$19</span>
          </div>
<ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" /> Profile spotlight rotation</li>
                  <li className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" /> Custom CTA link on your card</li>
                  <li className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" /> Premium founder profile</li>
                  <li className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" /> Lead capture form</li>
                </ul>
          <Link
            href="/pricing"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-fire px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-fire/90"
          >
            Get featured
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      );
    }

    if (plan === "pro") {
      return (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-card/30 p-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Founder Pro</span>
            <span className="ml-auto text-xs font-bold text-amber-400">$12/mo</span>
          </div>
<ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" /> Everything in Launch</li>
                  <li className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" /> Priority spotlight slots</li>
                  <li className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" /> Full analytics dashboard</li>
                </ul>
          <Link
            href="/pricing"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 transition-all hover:bg-amber-500/20"
          >
            Go Pro
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden rounded-xl border border-border/20 bg-gradient-to-br from-card/30 to-panel/10 p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-panel/60">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Free</span>
          <span className="ml-auto text-xs font-bold text-muted-foreground">$0</span>
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50" /> Vote on battles</li>
          <li className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50" /> Submit 1 idea</li>
          <li className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50" /> Browse the leaderboard</li>
        </ul>
        <Link
          href="/submit"
          className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-border/40 px-3 py-1.5 text-xs font-bold text-muted-foreground transition-all hover:border-fire/30 hover:text-fire"
        >
          Start free
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

const MIN_MEMBERS_FOR_FULL_GRID = 3;
const PROMO_FILLERS: Array<"launch" | "pro" | "free"> = ["launch", "pro", "free"];
const AUTO_SLIDE_MS = 3500;

export function PaidMemberSpotlight({
  category,
  limit = 6,
  title = "Arena spotlight",
  compact = false,
  placement = "section",
  variant = "grid",
}: PaidMemberSpotlightProps) {
  const [members, setMembers] = useState<FeaturedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

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
      .then((nextMembers) => {
        setMembers(nextMembers.filter((member) => member.idea_id && member.idea_name));
        setActiveIndex(0);
      })
      .catch(() => {
        setMembers([]);
        setActiveIndex(0);
      })
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

  const slideCount = members.length;

  useEffect(() => {
    if (variant !== "carousel" || paused || slideCount < 2) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, AUTO_SLIDE_MS);

    return () => window.clearTimeout(timer);
  }, [activeIndex, paused, slideCount, variant]);

  const goToSlide = (nextIndex: number) => {
    if (slideCount === 0) return;
    setActiveIndex((nextIndex + slideCount) % slideCount);
  };

  const sectionClass =
    placement === "bottom"
      ? "mt-10 border-t border-border/20 pt-8"
      : "mb-8";

  if (loading) {
    return (
      <section className={sectionClass}>
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-fire" />
          Loading featured founders
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return (
      <section className={sectionClass}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-fire">
          {category ? `${category} founders` : "Featured founders"}
        </p>
        <h2 className={`mt-1 font-[family-name:var(--font-chakra)] ${compact ? "text-base" : "text-lg"} font-black`}>
          {title}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <PlanCard plan="launch" />
          <PlanCard plan="pro" />
          <PlanCard plan="free" />
        </div>
      </section>
    );
  }

  if (variant === "carousel") {
    return (
      <section className={sectionClass}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-fire">
              {category ? `${category} founders` : "Featured founders"}
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-chakra)] text-xl font-black">
              {title}
            </h2>
          </div>

          {slideCount > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => goToSlide(activeIndex - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 text-muted-foreground transition-all hover:border-fire/30 hover:text-fire hover:shadow-[0_0_15px_rgba(220,60,30,0.15)]"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goToSlide(activeIndex + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 text-muted-foreground transition-all hover:border-fire/30 hover:text-fire hover:shadow-[0_0_15px_rgba(220,60,30,0.15)]"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div
          className="overflow-hidden rounded-xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
          >
            {members.map((member, index) => (
              <div key={member.id} className="min-w-full px-0.5">
                <MemberCard member={member} category={category} position={index + 1} mode="carousel" />
              </div>
            ))}
          </div>
        </div>

        {slideCount > 1 && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5">
              {members.map((_, index) => (
                <button
                  key={`dot-${members[index].id}`}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`rounded-full transition-all duration-300 ${
                    activeIndex === index
                      ? "h-2 w-8 bg-fire shadow-[0_0_8px_rgba(220,60,30,0.4)]"
                      : "h-2 w-2 bg-border/60 hover:bg-muted-foreground/40"
                  }`}
                  aria-label={`Show slide ${index + 1}`}
                />
              ))}
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-border/35 sm:max-w-[180px]">
              <div
                key={`spotlight-progress-${activeIndex}`}
                className="h-full origin-left bg-fire animate-spotlight-progress"
                style={{ animationPlayState: paused ? "paused" : "running" }}
              />
            </div>
            <Link
              href="/founders"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-fire"
            >
              All founders
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-fire">
            {category ? `${category} founders` : "Featured founders"}
          </p>
          <h2 className={`font-[family-name:var(--font-chakra)] ${compact ? "text-base" : "text-lg"} font-black`}>
            {title}
          </h2>
        </div>
        <Link
          href="/founders"
          className="shrink-0 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-fire"
        >
          View all
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className={compact ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
        {members.map((member, index) => (
          <MemberCard key={`${member.id}-${member.idea_id ?? "profile"}`} member={member} category={category} position={index + 1} mode="grid" />
        ))}
        {members.length < MIN_MEMBERS_FOR_FULL_GRID && PROMO_FILLERS.slice(0, MIN_MEMBERS_FOR_FULL_GRID - members.length).map((plan) => (
          <PlanCard key={plan} plan={plan} />
        ))}
      </div>
    </section>
  );
}
