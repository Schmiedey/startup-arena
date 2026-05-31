"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CATEGORIES, Category, STAGES, Stage } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditIdeaPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [problem, setProblem] = useState("");
  const [revenueModel, setRevenueModel] = useState("");
  const [category, setCategory] = useState<Category>("AI");
  const [stage, setStage] = useState<Stage>("Idea");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/signin");
      return;
    }
    async function load() {
      try {
        const res = await fetch(`/api/ideas?id=${id}`);
        const data = await res.json();
        if (!data.length) { setNotFound(true); return; }
        const idea = data[0];
        if (idea.user_id !== session?.user?.id) {
          const adminCheck = await fetch("/api/admin/stats");
          if (!adminCheck.ok) { setNotAuthorized(true); return; }
        }
        setName(idea.name);
        setPitch(idea.pitch);
        setTargetCustomer(idea.target_customer);
        setProblem(idea.problem);
        setRevenueModel(idea.revenue_model);
        setCategory(idea.category);
        setStage(idea.stage);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, session, status, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ideas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: name.trim(),
          pitch: pitch.trim(),
          target_customer: targetCustomer.trim(),
          problem: problem.trim(),
          revenue_model: revenueModel.trim(),
          category,
          stage,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update");
      }
      router.push(`/idea/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this idea permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ideas?ideaId=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/dashboard");
    } catch {
      setError("Failed to delete. Try again.");
      setDeleting(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fire" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-black">Idea not found</h1>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-fire hover:underline">back to dashboard</Link>
      </div>
    );
  }

  if (notAuthorized) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-black">Not authorized</h1>
        <p className="mt-2 text-muted-foreground">You can only edit your own ideas.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-fire hover:underline">back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Link href={`/idea/${id}`} className="mb-6 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3 w-3" />
        back to idea
      </Link>

      <h1 className="mb-8 text-2xl font-black">edit idea</h1>

      {error && (
        <div className="mb-4 rounded-none border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider">Idea Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="bg-background/30 border-border/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pitch" className="text-xs font-semibold uppercase tracking-wider">One-sentence pitch</Label>
          <Textarea id="pitch" value={pitch} onChange={(e) => setPitch(e.target.value)} required maxLength={300} className="min-h-[72px] resize-none bg-background/30 border-border/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="target" className="text-xs font-semibold uppercase tracking-wider">Target customer</Label>
          <Input id="target" value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)} required maxLength={100} className="bg-background/30 border-border/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="problem" className="text-xs font-semibold uppercase tracking-wider">Problem solved</Label>
          <Textarea id="problem" value={problem} onChange={(e) => setProblem(e.target.value)} required maxLength={500} className="min-h-[72px] resize-none bg-background/30 border-border/50" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="revenue" className="text-xs font-semibold uppercase tracking-wider">How it makes money</Label>
          <Input id="revenue" value={revenueModel} onChange={(e) => setRevenueModel(e.target.value)} required maxLength={100} className="bg-background/30 border-border/50" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="bg-background/30 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider">Stage</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as Stage)}>
              <SelectTrigger className="bg-background/30 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving} className="bg-fire text-fire-foreground hover:bg-fire/90 font-bold uppercase tracking-wider text-sm">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save changes"}
          </Button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-none px-4 py-2 text-xs font-semibold uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deleting..." : "Delete idea"}
          </button>
        </div>
      </form>
    </div>
  );
}
