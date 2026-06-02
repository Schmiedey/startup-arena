"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Sparkles, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics-client";
import { signinPathFor } from "@/lib/auth-redirect";

type CheckoutPlan = "launch-pass" | "founder-pro-monthly" | "founder-pro-yearly";
const checkoutPlans: CheckoutPlan[] = ["launch-pass", "founder-pro-monthly", "founder-pro-yearly"];

async function readJsonResponse(res: Response): Promise<Record<string, unknown>> {
  return res.json().catch(() => ({}));
}

function isCheckoutPlan(value: string | null): value is CheckoutPlan {
  return checkoutPlans.includes(value as CheckoutPlan);
}

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "",
    description: "For voters and first-time founders testing one idea.",
    features: ["Vote on battles", "Browse rankings", "Submit 1 idea", "Basic comments and reasons"],
    cta: "Start free",
    href: "/submit",
    icon: Trophy,
  },
  {
    id: "launch-pass",
    name: "Launch Pass",
    price: "$19",
    cadence: "one-time",
    description: "Best for testing several ideas and sharing challenge links.",
    features: ["Submit up to 5 ideas", "Challenge links for each idea", "Share-ready idea cards", "Public comments and vote reasons"],
    cta: "Buy Launch Pass",
    checkoutPlan: "launch-pass" as CheckoutPlan,
    icon: Zap,
    featured: true,
  },
  {
    id: "founder-pro",
    name: "Founder Pro",
    price: "$12",
    cadence: "/mo",
    description: "For repeat builders who want unlimited idea testing.",
    features: ["Unlimited ideas", "Category battle testing", "Founder profile visibility", "Ongoing challenge links"],
    cta: "Start Founder Pro",
    checkoutPlan: "founder-pro-monthly" as CheckoutPlan,
    secondaryCheckoutPlan: "founder-pro-yearly" as CheckoutPlan,
    icon: Sparkles,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutStartedFromUrl = useRef(false);
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async (plan: CheckoutPlan) => {
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
  }, [router]);

  useEffect(() => {
    const checkoutPlan = searchParams.get("checkout");
    if (checkoutStartedFromUrl.current || !isCheckoutPlan(checkoutPlan)) return;

    checkoutStartedFromUrl.current = true;
    void startCheckout(checkoutPlan);
  }, [searchParams, startCheckout]);

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
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-fire/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-fire">
          <Sparkles className="h-3 w-3" />
          Pricing
        </div>
        <h1 className="text-3xl font-black font-[family-name:var(--font-chakra)] sm:text-4xl">
          Pay after the idea matters
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Voting stays free so comparisons stay sharp. Founders pay for more submissions, challenge links, and feedback loops.
        </p>
      </div>

      {error && (
        <div className="mb-5 border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const href = "href" in plan ? plan.href : null;
          const checkoutPlan = "checkoutPlan" in plan ? plan.checkoutPlan : null;
          const secondaryCheckoutPlan = "secondaryCheckoutPlan" in plan ? plan.secondaryCheckoutPlan : null;
          return (
            <div
              key={plan.id}
              className={`flex min-h-[420px] flex-col border p-5 ${
                plan.featured ? "border-fire/50 bg-fire/5 shadow-[0_0_40px_rgba(220,60,30,0.12)]" : "border-border/40 bg-card/20"
              }`}
            >
              <div className="mb-5 flex items-center justify-between">
                <Icon className={`h-5 w-5 ${plan.featured ? "text-fire" : "text-muted-foreground"}`} />
                {plan.featured && (
                  <span className="border border-fire/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-fire">
                    Best first buy
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black">{plan.name}</h2>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black font-[family-name:var(--font-chakra)]">{plan.price}</span>
                {plan.cadence && <span className="text-sm text-muted-foreground">{plan.cadence}</span>}
              </div>
              <p className="mt-3 min-h-12 text-sm text-muted-foreground">{plan.description}</p>

              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fire" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6">
                {href || !checkoutPlan ? (
                  <Link href={href ?? "/submit"}>
                    <Button variant="outline" className="w-full rounded-none">
                      {plan.cta}
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={() => startCheckout(checkoutPlan)}
                      disabled={loadingPlan !== null}
                      className={`w-full rounded-none ${plan.featured ? "bg-fire text-fire-foreground hover:bg-fire/90" : ""}`}
                      variant={plan.featured ? "default" : "outline"}
                    >
                      {loadingPlan === checkoutPlan ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {plan.cta}
                    </Button>
                    {secondaryCheckoutPlan && (
                      <button
                        onClick={() => startCheckout(secondaryCheckoutPlan)}
                        disabled={loadingPlan !== null}
                        className="w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-fire disabled:opacity-50"
                      >
                        Or $99/year
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 border border-border/30 bg-card/20 px-4 py-3 text-sm text-muted-foreground sm:flex-row">
        <span>Already subscribed? Manage your Stripe billing portal.</span>
        <button onClick={openBillingPortal} className="font-semibold uppercase tracking-wider text-fire hover:underline">
          Manage billing
        </button>
      </div>
    </div>
  );
}
