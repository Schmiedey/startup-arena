"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ExternalLink, Flame, Loader2, Shield, Sparkles, Target, Trophy, Zap, Swords, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics-client";
import { signinPathFor } from "@/lib/auth-redirect";
import { LikelyrBackground } from "@/components/likelyr-background";
import { ScrollReveal } from "@/components/scroll-reveal";
import { HomeStats } from "@/components/home-stats";

type CheckoutPlan = "launch-pass" | "founder-pro-monthly" | "founder-pro-yearly";
type BillingPlan = "free" | "launch" | "pro";
const checkoutPlans: CheckoutPlan[] = ["launch-pass", "founder-pro-monthly", "founder-pro-yearly"];

async function readJsonResponse(res: Response): Promise<Record<string, unknown>> {
  return res.json().catch(() => ({}));
}

function isCheckoutPlan(value: string | null): value is CheckoutPlan {
  return checkoutPlans.includes(value as CheckoutPlan);
}

const FREE_FEATURES = [
  { label: "Vote on unlimited battles", detail: "Help ideas climb or fall" },
  { label: "Browse the leaderboard", detail: "See top-rated ideas by category" },
  { label: "Submit 1 idea", detail: "Get your first idea in the arena" },
  { label: "Leave comments and reasons", detail: "Share why you voted the way you did" },
  { label: "Predictor score", detail: "Track how well you read the crowd" },
];

const LAUNCH_FEATURES = [
  { label: "Submit up to 5 ideas", detail: "Test multiple concepts simultaneously" },
  { label: "Featured founder spotlight", detail: "Your profile rotates on battle and founder pages" },
  { label: "Premium founder profile", detail: "Headline, bio, CTA link, and category filter" },
  { label: "Challenge links for each idea", detail: "Share a direct link to battle your idea" },
  { label: "Lead capture form", detail: "Collect emails from interested voters" },
  { label: "Spotlight analytics", detail: "See how many views and clicks your profile gets" },
  { label: "Everything in Free", detail: null },
];

const PRO_FEATURES = [
  { label: "Unlimited ideas", detail: "No cap on how many you submit" },
  { label: "Category battle targeting", detail: "Choose which category your ideas battle in" },
  { label: "Priority spotlight placement", detail: "Your card shows before Launch members" },
  { label: "Private analytics dashboard", detail: "Full idea analytics — views, votes, Elo trends, CTA conversions" },
  { label: "Founder updates", detail: "Post updates that reach all voters on your ideas" },
  { label: "Weekly digest queue", detail: "Your ideas appear in the weekly momentum digest" },
  { label: "Private feedback insights", detail: "Automated coaching based on your idea performance" },
  { label: "Everything in Launch Pass", detail: null },
];

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "",
    description: "Vote, browse, and submit your first idea. No card needed.",
    features: FREE_FEATURES,
    cta: "Start free",
    href: "/submit",
    icon: Trophy,
    accent: "from-background/60 via-card/30 to-background/60",
    ring: "ring-border/40",
    iconBg: "bg-card/60",
    iconColor: "text-muted-foreground",
  },
  {
    id: "launch-pass",
    name: "Launch Pass",
    price: "$19",
    cadence: "one-time",
    description: "One payment. No recurring fees. Get visible and start collecting leads.",
    features: LAUNCH_FEATURES,
    cta: "Buy Launch Pass",
    checkoutPlan: "launch-pass" as CheckoutPlan,
    icon: Zap,
    featured: true,
    accent: "from-fire/10 via-ember/5 to-transparent",
    ring: "ring-fire/40",
    iconBg: "bg-fire/10",
    iconColor: "text-fire",
  },
  {
    id: "founder-pro",
    name: "Founder Pro",
    price: "$12",
    cadence: "/mo",
    description: "Unlimited ideas, analytics, direct feedback, and full arena control.",
    features: PRO_FEATURES,
    cta: "Start Founder Pro",
    checkoutPlan: "founder-pro-monthly" as CheckoutPlan,
    secondaryCheckoutPlan: "founder-pro-yearly" as CheckoutPlan,
    icon: Sparkles,
    accent: "from-amber-500/10 via-amber-500/5 to-transparent",
    ring: "ring-amber-400/30",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
];

const COMPARISON = [
  { feature: "Submit ideas", free: "1", launch: "5", pro: "Unlimited" },
  { feature: "Vote on battles", free: true, launch: true, pro: true },
  { feature: "Browse leaderboard", free: true, launch: true, pro: true },
  { feature: "Predictor score", free: true, launch: true, pro: true },
  { feature: "Comments and reasons", free: true, launch: true, pro: true },
  { feature: "Founder profile page", free: false, launch: true, pro: true },
  { feature: "Featured spotlight placement", free: false, launch: true, pro: "Priority" },
  { feature: "Challenge links", free: false, launch: true, pro: true },
  { feature: "Lead capture form", free: false, launch: true, pro: true },
  { feature: "Spotlight analytics", free: false, launch: true, pro: true },
  { feature: "Category targeting", free: false, launch: false, pro: true },
  { feature: "Full analytics dashboard", free: false, launch: false, pro: true },
  { feature: "Founder updates", free: false, launch: false, pro: true },
  { feature: "Weekly digest queue", free: false, launch: false, pro: true },
  { feature: "Private feedback insights", free: false, launch: false, pro: true },
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutStartedFromUrl = useRef(false);
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [userPlan, setUserPlan] = useState<BillingPlan | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);

  const ownsLaunchPass = userPlan === "launch" || userPlan === "pro";
  const ownsFounderPro = userPlan === "pro";

  const startCheckout = useCallback(async (plan: CheckoutPlan) => {
    if (plan === "launch-pass" && ownsLaunchPass) {
      setError("Launch Pass is already purchased on this account.");
      return;
    }
    if ((plan === "founder-pro-monthly" || plan === "founder-pro-yearly") && ownsFounderPro) {
      setError("You are already subscribed to Founder Pro.");
      return;
    }

    setLoadingPlan(plan);
    setError(null);
    trackClientEvent("checkout_cta_clicked", { plan });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await readJsonResponse(res);

      if (res.status === 401) {
        trackClientEvent("checkout_auth_required", { plan });
        router.push(signinPathFor(`/pricing?checkout=${plan}`, window.location.origin));
        return;
      }
      if (res.status === 409 && plan === "launch-pass") {
        setUserPlan("launch");
      }
      if (res.status === 409 && (plan === "founder-pro-monthly" || plan === "founder-pro-yearly")) {
        setUserPlan("pro");
      }
      if (!res.ok || typeof data.url !== "string") {
        throw new Error(typeof data.error === "string" ? data.error : "Could not start checkout");
      }

      trackClientEvent("checkout_redirected", { plan });
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
    } finally {
      setLoadingPlan(null);
    }
  }, [ownsFounderPro, ownsLaunchPass, router]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        const res = await fetch("/api/me");
        const data = await readJsonResponse(res);
        const maybeUser = data.user as { plan?: unknown } | null | undefined;
        const plan = maybeUser?.plan;

        if (!cancelled && (plan === "free" || plan === "launch" || plan === "pro")) {
          setUserPlan(plan);
        }
      } finally {
        if (!cancelled) setPlanLoaded(true);
      }
    }

    void loadPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const checkoutPlan = searchParams.get("checkout");
    if (!planLoaded || checkoutStartedFromUrl.current || !isCheckoutPlan(checkoutPlan)) return;

    checkoutStartedFromUrl.current = true;
    void startCheckout(checkoutPlan);
  }, [planLoaded, searchParams, startCheckout]);

  async function openBillingPortal() {
    setError(null);
    trackClientEvent("billing_portal_clicked");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await readJsonResponse(res);
      if (res.status === 401) {
        router.push(signinPathFor("/pricing", window.location.origin));
        return;
      }
      if (!res.ok || typeof data.url !== "string") {
        throw new Error(typeof data.error === "string" ? data.error : "Billing portal is not available yet");
      }
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open billing portal");
    }
  }

  return (
    <div className="relative mx-auto max-w-5xl px-6 py-10 sm:py-16">
      <LikelyrBackground className="opacity-[0.06]" />
      <div className="relative z-10">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-fire/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-fire ring-1 ring-fire/20">
            <Flame className="h-3 w-3" />
            Pricing
          </div>
          <h1 className="text-3xl font-black font-[family-name:var(--font-chakra)] sm:text-5xl">
            pay after the idea <span className="text-gradient-fire">matters</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Voting stays free so comparisons stay sharp. Pay for more submissions, founder visibility, and direct feedback.
          </p>

          <div className="mt-6">
            <HomeStats />
          </div>
        </div>

        {error && (
          <div className="mb-6 border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const href = "href" in plan ? plan.href : null;
            const checkoutPlan = "checkoutPlan" in plan ? plan.checkoutPlan : null;
            const secondaryCheckoutPlan = "secondaryCheckoutPlan" in plan ? plan.secondaryCheckoutPlan : null;
            const isOwnedLaunchPlan = plan.id === "launch-pass" && ownsLaunchPass;
            const isOwnedProPlan = plan.id === "founder-pro" && ownsFounderPro;
            return (
              <div
                key={plan.id}
                className={`relative flex min-h-[580px] flex-col overflow-hidden rounded-xl border p-6 transition-all duration-300 ${
                  plan.featured
                    ? "border-fire/40 bg-gradient-to-br from-fire/5 via-card/30 to-panel/10 shadow-[0_0_50px_rgba(220,60,30,0.1)] hover:shadow-[0_0_60px_rgba(220,60,30,0.18)]"
                    : "border-border/30 bg-gradient-to-br from-card/40 via-card/20 to-background/30 hover:border-border/50"
                }`}
              >
                {plan.featured && (
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fire/60 to-transparent" />
                )}

                <div className="mb-5 flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg} ring-1 ${plan.ring}`}>
                    <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                  </div>
                  {plan.featured && (
                    <span className="rounded-full bg-fire/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-fire ring-1 ring-fire/20">
                      {isOwnedLaunchPlan ? "Purchased" : "Best first buy"}
                    </span>
                  )}
                  {isOwnedProPlan && (
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-400 ring-1 ring-amber-400/20">
                      Subscribed
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-black">{plan.name}</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black font-[family-name:var(--font-chakra)]">{plan.price}</span>
                  {plan.cadence && <span className="text-sm text-muted-foreground">{plan.cadence}</span>}
                  {plan.id === "launch-pass" && (
                    <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/20">
                      No subscription
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

                <div className="mt-5 space-y-2.5">
                  {plan.features.map((feature) => (
                    <div key={typeof feature === "string" ? feature : feature.label} className="flex items-start gap-2.5 text-sm">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? "text-fire" : "text-muted-foreground"}`} />
                      <div>
                        <span className="font-medium">{typeof feature === "string" ? feature : feature.label}</span>
                        {typeof feature !== "string" && feature.detail && (
                          <span className="ml-1 text-muted-foreground">{feature.detail}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  {href || !checkoutPlan ? (
                    <Link href={href ?? "/submit"}>
                      <Button variant="outline" className="w-full rounded-xl h-11">
                        {plan.cta}
                      </Button>
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={() => startCheckout(checkoutPlan)}
                        disabled={loadingPlan !== null || isOwnedLaunchPlan || isOwnedProPlan}
                        className={`w-full rounded-xl h-11 ${plan.featured ? "btn-fire bg-fire text-fire-foreground hover:bg-fire/90" : ""}`}
                        variant={plan.featured ? "default" : "outline"}
                      >
                        {loadingPlan === checkoutPlan ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {isOwnedLaunchPlan ? "Already purchased" : isOwnedProPlan ? "Already subscribed" : plan.cta}
                      </Button>
                      {secondaryCheckoutPlan && !isOwnedProPlan && (
                        <button
                          onClick={() => startCheckout(secondaryCheckoutPlan)}
                          disabled={loadingPlan !== null}
                          className="w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-fire disabled:opacity-50"
                        >
                          Or $99/year <span className="text-emerald-400 normal-case tracking-normal">save 31%</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-border/30 bg-gradient-to-br from-card/30 via-card/10 to-background/30 px-5 py-4 text-sm text-muted-foreground sm:flex-row">
          <span>Founder Pro subscriber?</span>
          <button onClick={openBillingPortal} className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-fire transition-colors hover:text-fire/80">
            Manage subscription
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-16">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="mx-auto flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-fire"
          >
            {showComparison ? "Hide" : "Show"} full feature comparison
            <ArrowRight className={`h-3.5 w-3.5 transition-transform ${showComparison ? "rotate-90" : ""}`} />
          </button>

          {showComparison && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="pb-3 pr-4 text-left font-semibold text-muted-foreground">Feature</th>
                    <th className="pb-3 px-4 text-center font-semibold">Free</th>
                    <th className="pb-3 px-4 text-center font-semibold text-fire">Launch Pass</th>
                    <th className="pb-3 px-4 text-center font-semibold text-amber-400">Founder Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? "bg-card/10" : ""}>
                      <td className="py-2.5 pr-4 text-muted-foreground">{row.feature}</td>
                      <td className="py-2.5 px-4 text-center">
                        {row.free === true ? (
                          <Check className="mx-auto h-4 w-4 text-muted-foreground" />
                        ) : row.free === false ? (
                          <span className="text-muted-foreground/30">—</span>
                        ) : (
                          <span className="font-medium">{row.free}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {row.launch === true ? (
                          <Check className="mx-auto h-4 w-4 text-fire" />
                        ) : row.launch === false ? (
                          <span className="text-muted-foreground/30">—</span>
                        ) : (
                          <span className="font-semibold text-fire">{row.launch}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {row.pro === true ? (
                          <Check className="mx-auto h-4 w-4 text-amber-400" />
                        ) : row.pro === false ? (
                          <span className="text-muted-foreground/30">—</span>
                        ) : (
                          <span className="font-semibold text-amber-400">{row.pro}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-16">
          <ScrollReveal animation="reveal-up">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-fire">How it works</p>
              <h2 className="text-2xl font-black font-[family-name:var(--font-chakra)] sm:text-3xl">
                three steps. thirty seconds.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: Swords, title: "Submit your idea", desc: "Name it. Pitch it. Pick a category. Takes 30 seconds." },
              { icon: TrendingUp, title: "Battle for votes", desc: "Your idea goes head-to-head. The crowd decides what survives." },
              { icon: Target, title: "Climb or learn", desc: "Win battles, gain Elo, collect leads. Or find the weak spot fast." },
            ].map((step, i) => (
              <ScrollReveal key={step.title} animation="reveal-up" delay={i * 100}>
                <div className="group relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-card/40 via-card/20 to-background/20 p-6 text-center transition-all duration-300 hover:border-fire/20 hover:shadow-[0_0_30px_rgba(220,60,30,0.06)]">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fire/20 to-transparent" />
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-fire/10 ring-1 ring-fire/20 transition-all duration-300 group-hover:bg-fire/15 group-hover:ring-fire/30 group-hover:scale-110">
                    <step.icon className="h-6 w-6 text-fire" />
                  </div>
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <ScrollReveal animation="reveal-up">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black font-[family-name:var(--font-chakra)] sm:text-3xl">
                common questions
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { q: "Is Launch Pass really one-time?", a: "Yes. $19 once. No monthly charge, no auto-renewal. You keep all 5 idea slots and your profile forever." },
              { q: "Can I upgrade from Launch to Pro?", a: "Yes. Founder Pro includes everything in Launch Pass plus unlimited ideas, analytics, and priority placement. You'll be charged $12/mo on top." },
              { q: "Do free users see my spotlight card?", a: "Yes — that's the point. Your profile card rotates on battle pages and the founders page where every voter sees it." },
              { q: "What happens if I cancel Pro?", a: "Your ideas stay, but extra Pro features pause. You revert to Launch Pass or Free tier depending on what you've purchased." },
              { q: "How does the challenge link work?", a: "You get a unique URL for each idea. Share it anywhere — social, email, your site — and visitors land in a battle with your idea matched against a real opponent." },
              { q: "What's a lead capture form?", a: "Voters on your founder profile can leave their email and a message. You see these leads in your dashboard and get notified." },
            ].map((faq, i) => (
              <ScrollReveal key={faq.q} animation="reveal-up" delay={i * 60}>
                <div className="rounded-xl border border-border/30 bg-gradient-to-br from-card/30 via-card/15 to-background/20 p-5">
                  <h3 className="font-bold">{faq.q}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <ScrollReveal animation="reveal-up">
            <div className="relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-fire/5 via-card/20 to-ember/5 p-8 sm:p-10 text-center backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-fire/5 via-transparent to-ember/5 pointer-events-none" />
              <div className="relative z-10">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-fire/10 ring-1 ring-fire/25">
                  <Shield className="h-6 w-6 text-fire" />
                </div>
                <h2 className="text-xl font-black font-[family-name:var(--font-chakra)] sm:text-2xl">
                  cancel anytime. no lock-in.
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  Launch Pass is a one-time payment — no subscription, no surprise charges. Founder Pro is month-to-month through Stripe. Cancel with one click from your billing dashboard.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
