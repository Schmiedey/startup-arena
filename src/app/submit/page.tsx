"use client";

import { useState } from "react";
import { CATEGORIES, Category, STAGES, Stage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2, Flame, AlertCircle } from "lucide-react";
import { LikelyrLogo } from "@/components/likelyr-logo";
import { LikelyrBackground } from "@/components/likelyr-background";
import Link from "next/link";
import { trackClientEvent } from "@/lib/analytics-client";
import { ideaPath } from "@/lib/seo";

export default function SubmitPage() {
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [problem, setProblem] = useState("");
  const [revenueModel, setRevenueModel] = useState("");
  const [category, setCategory] = useState<Category>("AI");
  const [stage, setStage] = useState<Stage>("Idea");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setUpgradeUrl(null);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          pitch: pitch.trim(),
          target_customer: targetCustomer.trim(),
          problem: problem.trim(),
          revenue_model: revenueModel.trim(),
          category,
          stage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIdeaId(data.id);
        setSubmitted(true);
        trackClientEvent("idea_submit_completed", { category, stage });
      } else {
        const data = await res.json().catch(() => ({ error: "Something went wrong" }));
        setError(data.error || "Failed to submit. Please try again.");
        setUpgradeUrl(typeof data.upgradeUrl === "string" ? data.upgradeUrl : null);
        if (res.status === 402) {
          trackClientEvent("idea_limit_hit", { category, stage, plan: data.plan ?? null });
        }
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-fire/10">
          <Check className="h-10 w-10 text-fire" />
        </div>
        <h1 className="mb-2 text-3xl font-black">You&apos;re on Likelyr</h1>
        <p className="mb-2 text-muted-foreground">
          <span className="text-foreground font-semibold">&quot;{name}&quot;</span> enters at 1000 Elo.
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          Go battle other ideas and climb the ranks. Either way, you&apos;ll know what the crowd thinks.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/battle"
            className="inline-flex items-center gap-2 rounded-none btn-fire bg-fire px-6 py-3 font-bold text-fire-foreground hover:bg-fire/90"
          >
            <LikelyrLogo className="h-4 w-4" />
            Start Voting
          </Link>
          {ideaId && (
            <Link
              href={ideaPath({ id: ideaId, name })}
              className="inline-flex items-center gap-2 rounded-none border border-border/60 px-6 py-3 font-semibold hover:bg-panel"
            >
              View Your Idea
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-lg px-4 py-10">
      <LikelyrBackground className="opacity-[0.08]" />
      <div className="relative z-10">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-fire/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-fire">
          <Flame className="h-3 w-3" />
          Submit
        </div>
        <h1 className="text-3xl font-black">Test your idea</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No business plans. No pitch decks. Just the raw idea.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-none border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">{error}</span>
          {upgradeUrl && (
            <Link
              href={upgradeUrl}
              className="shrink-0 font-bold uppercase tracking-wider text-fire hover:underline"
            >
              Upgrade
            </Link>
          )}
        </div>
      )}

      <Card className="border-border/40 bg-card/30">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider">Idea Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. LeadSniper AI"
                required
                maxLength={100}
                className="bg-background/30 border-border/50"
              />
            </div>

<div className="space-y-1.5">
              <Label htmlFor="pitch" className="text-xs font-semibold uppercase tracking-wider">One-sentence pitch</Label>
              <Textarea
                id="pitch"
                value={pitch}
                onChange={(e) => setPitch(e.target.value.slice(0, 300))}
                placeholder="e.g. AI tool that finds local businesses with bad websites and sends personalized cold emails."
                required
                maxLength={300}
                className="min-h-[72px] resize-none bg-background/30 border-border/50"
              />
              <p className="text-xs text-right text-muted-foreground/60">{pitch.length}/300</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="targetCustomer" className="text-xs font-semibold uppercase tracking-wider">Target customer</Label>
              <Input
                id="targetCustomer"
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
                placeholder="e.g. Small business owners"
                required
                maxLength={100}
                className="bg-background/30 border-border/50"
              />
            </div>

<div className="space-y-1.5">
              <Label htmlFor="problem" className="text-xs font-semibold uppercase tracking-wider">Problem solved</Label>
              <Textarea
                id="problem"
                value={problem}
                onChange={(e) => setProblem(e.target.value.slice(0, 500))}
                placeholder="e.g. Small businesses have terrible websites but don't know where to start."
                required
                maxLength={500}
                className="min-h-[72px] resize-none bg-background/30 border-border/50"
              />
              <p className="text-xs text-right text-muted-foreground/60">{problem.length}/500</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="revenueModel" className="text-xs font-semibold uppercase tracking-wider">How it makes money</Label>
              <Input
                id="revenueModel"
                value={revenueModel}
                onChange={(e) => setRevenueModel(e.target.value)}
                placeholder="e.g. SaaS subscription $49/mo"
                required
                maxLength={100}
                className="bg-background/30 border-border/50"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger className="bg-background/30 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider">Stage</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as Stage)}>
                  <SelectTrigger className="bg-background/30 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full btn-fire bg-fire text-fire-foreground hover:bg-fire/90 font-bold uppercase tracking-wider text-sm"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entering...
                </>
              ) : (
                "Submit Idea"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
