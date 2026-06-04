"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [autoAccept, setAutoAccept] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setAutoAccept(data.auto_accept_ideas !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(value: boolean) {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_accept_ideas: value }),
      });
      if (res.ok) {
        setAutoAccept(value);
        setMessage(value ? "Ideas will be auto-approved" : "Ideas will require manual approval");
      }
    } catch {
      setMessage("Failed to update settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AdminLayout><div className="py-20 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-fire" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <h2 className="mb-6 text-sm font-bold uppercase tracking-wider">Settings</h2>

      <div className="space-y-6">
        <div className="border border-border/30 bg-card/20 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold">Idea Approval</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                When enabled, new ideas are automatically approved and enter the arena immediately.
                When disabled, new ideas require your manual approval before they appear in battles and rankings.
              </p>
            </div>
            <button
              onClick={() => handleToggle(!autoAccept)}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                autoAccept ? "bg-fire" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
                  autoAccept ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
              autoAccept ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${autoAccept ? "bg-emerald-400" : "bg-amber-400"}`} />
              {autoAccept ? "Auto-approve" : "Manual review"}
            </span>
          </div>
        </div>

        {message && (
          <p className="text-xs text-emerald-400">{message}</p>
        )}

        <div className="border border-border/30 bg-card/20 p-6">
          <h3 className="font-bold">About Settings</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Idea approval controls whether submitted ideas appear immediately in battles and rankings, or require admin review first.
            Toggle this off if you want to review each idea before it goes live.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            When manual review is on, new submissions appear in the Ideas admin panel with a &quot;pending&quot; status. You can approve or reject them from there.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}