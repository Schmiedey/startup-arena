"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ExternalLink, Loader2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics-client";

interface FounderLeadFormProps {
  founderUserId: string;
  founderName: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  showContact?: boolean | null;
}

export function FounderLeadForm({
  founderUserId,
  founderName,
  ctaLabel,
  ctaUrl,
  showContact = true,
}: FounderLeadFormProps) {
  const { data: session } = useSession();
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          founder_user_id: founderUserId,
          email: email.trim(),
          message: message.trim(),
          source: "founder_profile",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not send request");
      }

      trackClientEvent("founder_lead_form_completed", {
        profile_user_id: founderUserId,
      });
      setStatus("Request sent.");
      setMessage("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send request");
    } finally {
      setSubmitting(false);
    }
  }

  if (!showContact && !ctaUrl) return null;

  return (
    <div className="border border-border/30 bg-card/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Mail className="h-4 w-4 text-fire" />
        <h2 className="text-sm font-bold uppercase tracking-widest">Contact</h2>
      </div>

      {ctaUrl && (
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackClientEvent("profile_cta_clicked", {
              profile_user_id: founderUserId,
              source: "founder_profile",
            });
          }}
          className="mb-3 inline-flex w-full items-center justify-center gap-2 border border-fire/35 bg-fire/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-fire transition-colors hover:bg-fire/15"
        >
          {ctaLabel || "Visit"}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {showContact && (
        <form onSubmit={submitLead} className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value.slice(0, 254))}
            placeholder="you@example.com"
            type="email"
            required
            className="w-full border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-fire/50"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 600))}
            placeholder={`Ask ${founderName} for a demo, intro, or waitlist spot.`}
            rows={4}
            className="w-full resize-none border border-border/50 bg-background/40 px-3 py-2 text-sm outline-none focus:border-fire/50"
          />
          <Button
            type="submit"
            disabled={submitting}
            className="w-full gap-2 rounded-none btn-fire bg-fire text-fire-foreground hover:bg-fire/90"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send request
          </Button>
          {status && (
            <p className={`text-xs ${status === "Request sent." ? "text-emerald-400" : "text-red-400"}`}>
              {status}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
