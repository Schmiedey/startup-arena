"use client";

import { useState, useRef } from "react";
import { CATEGORIES, Category, STAGES, Stage } from "@/lib/types";
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
import { Check, Loader2, Flame, AlertCircle, Upload, X } from "lucide-react";
import { LikelyrLogo } from "@/components/likelyr-logo";
import Link from "next/link";
import { trackClientEvent } from "@/lib/analytics-client";
import { ideaPath } from "@/lib/seo";

const FIELDS = [
  { key: "name", label: "Idea Name", placeholder: "e.g. LeadSniper AI", type: "input", maxLength: 100, required: true,
    description: "Give your idea a catchy, memorable name." },
  { key: "pitch", label: "One-sentence pitch", placeholder: "e.g. AI tool that finds local businesses with bad websites and sends personalized cold emails.", type: "textarea", maxLength: 300, required: true,
    description: "Describe what it does in one clear sentence." },
  { key: "target_customer", label: "Target customer", placeholder: "e.g. Small business owners", type: "input", maxLength: 100, required: true,
    description: "Who specifically would pay for this?" },
  { key: "problem", label: "Problem solved", placeholder: "e.g. Small businesses have terrible websites but don't know where to start.", type: "textarea", maxLength: 500, required: true,
    description: "What pain point does this solve?" },
  { key: "revenue_model", label: "How it makes money", placeholder: "e.g. SaaS subscription $49/mo", type: "input", maxLength: 100, required: true,
    description: "What's the business model?" },
] as const;

export default function SubmitPage() {
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [problem, setProblem] = useState("");
  const [revenueModel, setRevenueModel] = useState("");
  const [category, setCategory] = useState<Category>("AI");
  const [stage, setStage] = useState<Stage>("Idea");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);
  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const setters: Record<string, React.Dispatch<React.SetStateAction<string>>> = {
    name: setName,
    pitch: setPitch,
    target_customer: setTargetCustomer,
    problem: setProblem,
    revenue_model: setRevenueModel,
  };

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setImageUrl(data.url);
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

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
          image_url: imageUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIdeaId(data.id);
        if (data._pending) {
          setPendingReview(true);
        }
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

  const isFormValid = name.trim() && pitch.trim() && targetCustomer.trim() && problem.trim() && revenueModel.trim();

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-fire/10">
          <Check className="h-10 w-10 text-fire" />
        </div>
        <h1 className="mb-2 text-3xl font-black">
          {pendingReview ? "Submitted for review" : "You're on Likelyr"}
        </h1>
        {pendingReview ? (
          <>
            <p className="mb-2 text-muted-foreground">
              <span className="text-foreground font-semibold">&quot;{name}&quot;</span> is waiting for admin approval.
            </p>
            <p className="mb-8 text-sm text-muted-foreground">
              New ideas are reviewed before entering the arena. You&apos;ll be notified once it&apos;s approved.
            </p>
          </>
        ) : (
          <>
            <p className="mb-2 text-muted-foreground">
              <span className="text-foreground font-semibold">&quot;{name}&quot;</span> enters at 1000 Elo.
            </p>
            <p className="mb-8 text-sm text-muted-foreground">
              Go battle other ideas and climb the ranks.
            </p>
          </>
        )}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/battle"
            className="inline-flex items-center gap-2 rounded-none btn-fire bg-fire px-6 py-3 font-bold text-fire-foreground hover:bg-fire/90"
          >
            <LikelyrLogo className="h-4 w-4" />
            Start Voting
          </Link>
          {ideaId && !pendingReview && (
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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-fire/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-fire">
          <Flame className="h-3 w-3" />
          Submit
        </div>
        <h1 className="text-3xl font-black sm:text-4xl">Test your idea</h1>
        <p className="mt-2 text-muted-foreground">
          No business plans. No pitch decks. Just the raw idea.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-none border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {FIELDS.map((field) => {
          const value = field.key === "name" ? name :
            field.key === "pitch" ? pitch :
            field.key === "target_customer" ? targetCustomer :
            field.key === "problem" ? problem :
            field.key === "revenue_model" ? revenueModel : "";
          const setter = setters[field.key];
          const currentLength = value.length;

          return (
            <div key={field.key} className="border border-border/30 bg-card/20 p-6">
              <div className="mb-3">
                <Label className="text-base font-bold">{field.label}</Label>
                {field.required && <span className="ml-1 text-fire">*</span>}
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{field.description}</p>
              {field.type === "textarea" ? (
                <>
                  <Textarea
                    value={value}
                    onChange={(e) => setter(e.target.value.slice(0, field.maxLength))}
                    placeholder={field.placeholder}
                    required={field.required}
                    maxLength={field.maxLength}
                    className="min-h-[88px] resize-none bg-background/30 border-border/50 text-base"
                  />
                  <p className={`mt-1 text-xs text-right ${currentLength > field.maxLength * 0.9 ? "text-fire" : "text-muted-foreground/60"}`}>
                    {currentLength}/{field.maxLength}
                  </p>
                </>
              ) : (
                <Input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  maxLength={field.maxLength}
                  className="bg-background/30 border-border/50 text-base"
                />
              )}
            </div>
          );
        })}

        {/* Category and Stage */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="border border-border/30 bg-card/20 p-6">
            <div className="mb-3">
              <Label className="text-base font-bold">Category<span className="ml-1 text-fire">*</span></Label>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">What industry does this fall under?</p>
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
          <div className="border border-border/30 bg-card/20 p-6">
            <div className="mb-3">
              <Label className="text-base font-bold">Stage<span className="ml-1 text-fire">*</span></Label>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">How far along is this idea?</p>
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

        {/* Image Upload */}
        <div className="border border-border/30 bg-card/20 p-6">
          <div className="mb-3">
            <Label className="text-base font-bold">Cover image</Label>
            <span className="ml-2 text-xs font-medium text-muted-foreground">(optional)</span>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">Add a screenshot, logo, or mockup. Shown in battles.</p>
          {imageUrl ? (
            <div className="relative inline-block">
              {/* eslint-disable @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Cover"
                className="max-h-48 rounded-none border border-border/30"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center bg-red-500 text-white hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-3 rounded-none border-2 border-dashed border-border/40 bg-background/20 px-6 py-8 text-muted-foreground transition-colors hover:border-fire/30 hover:text-fire disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
              <div className="text-left">
                <p className="text-sm font-semibold">{uploading ? "Uploading..." : "Click to upload"}</p>
                <p className="text-xs">JPEG, PNG, WebP, or GIF (max 2MB)</p>
              </div>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Submit */}
        <div className="border border-border/30 bg-card/20 p-6">
          <button
            type="submit"
            disabled={submitting || !isFormValid}
            className="w-full rounded-none btn-fire bg-fire px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-fire-foreground hover:bg-fire/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Entering the arena...
              </span>
            ) : (
              "Submit Idea"
            )}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Your idea enters at 1000 Elo and battles real voters immediately.
          </p>
        </div>
      </form>
    </div>
  );
}