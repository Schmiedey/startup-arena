import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-muted-foreground hover:text-fire transition-colors">
        &larr; back home
      </Link>
      <h1 className="mt-6 text-3xl font-black font-[family-name:var(--font-chakra)]">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-bold text-foreground">1. Acceptance</h2>
          <p>By using Likelyr, you agree to these terms. If you don&apos;t agree, don&apos;t use the service.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">2. What Likelyr Does</h2>
          <p>Likelyr is a platform where people submit ideas and the community votes on which ones are more likely to succeed. Ideas are ranked using an Elo-style rating system based on community votes.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">3. User Accounts</h2>
          <p>You may sign in using GitHub or Google. You are responsible for keeping your account secure. You must not create multiple accounts to manipulate votes.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">4. Content You Submit</h2>
          <p>By submitting an idea, comment, or vote reason, you grant Likelyr a non-exclusive license to display and promote that content on the platform. You retain ownership of your ideas. Likelyr does not claim any intellectual property rights over your concepts.</p>
          <p className="mt-2">You agree not to submit content that is abusive, illegal, spam, or violates others&apos; intellectual property.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">5. Voting & Fair Play</h2>
          <p>You may not vote on your own ideas. You may not create multiple accounts to inflate votes or ratings. We reserve the right to reset manipulated votes and ratings.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">6. Disclaimer</h2>
          <p>Likelyr is provided as-is. Elo ratings and community votes are opinions, not investment advice. We make no guarantees about the accuracy or usefulness of ratings.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">7. Payments & Subscriptions</h2>
          <p>Paid plans are processed by Stripe. One-time passes unlock the stated submission limits for the account that purchased them. Subscriptions renew until canceled through the billing portal.</p>
          <p className="mt-2">Refunds are handled case by case for billing mistakes, duplicate charges, or access failures. We may revoke paid access for fraud, payment disputes, abuse, or violations of these terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">8. Termination</h2>
          <p>We may suspend or terminate accounts that violate these terms, particularly for vote manipulation or abuse.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">9. Changes</h2>
          <p>We may update these terms at any time. Continued use of the service constitutes acceptance of the updated terms.</p>
        </section>
      </div>
    </div>
  );
}
