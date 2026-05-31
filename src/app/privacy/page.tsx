import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-xs text-muted-foreground hover:text-fire transition-colors">
        &larr; back home
      </Link>
      <h1 className="mt-6 text-3xl font-black font-[family-name:var(--font-chakra)]">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-bold text-foreground">1. Information We Collect</h2>
          <p><strong>Account information:</strong> When you sign in with GitHub or Google, we receive your name, email, and profile picture from the OAuth provider.</p>
          <p className="mt-2"><strong>Content you create:</strong> Ideas, comments, vote reasons, and battle votes you submit.</p>
          <p className="mt-2"><strong>Usage data:</strong> We collect standard product analytics including page views, clicks, referrers, campaign parameters, performance metrics, and error events.</p>
          <p className="mt-2"><strong>Payment data:</strong> Payments are processed by Stripe. We store Stripe customer and subscription identifiers, but not full card numbers.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">2. How We Use Your Information</h2>
          <p>We use your information to operate the platform, display ideas and rankings, and improve the service. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">3. Public Information</h2>
          <p>Your display name, ideas, comments, vote reasons, and ranking statistics are visible to other users. Email addresses are never shown publicly.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">4. Data Storage</h2>
          <p>Data is stored on Vercel&apos;s infrastructure using Vercel Postgres (Neon). Profile pictures you upload are stored directly in our database.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">5. Data Retention</h2>
          <p>We retain your data while your account is active. If you wish to delete your account, contact us and we will remove your personal information. Your submitted ideas and votes may be retained anonymously to maintain ranking integrity.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">6. Cookies</h2>
          <p>We use essential cookies for authentication and session management. We also use first-party analytics, Vercel Analytics, and PostHog-compatible product analytics to understand product usage and performance. We do not sell data to advertisers.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">7. Security</h2>
          <p>We implement reasonable security measures to protect your data. However, no internet transmission is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">8. Changes</h2>
          <p>We may update this policy from time to time. We will notify you of significant changes via the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">9. Contact</h2>
          <p>For privacy questions, reach out via the GitHub repository.</p>
        </section>
      </div>
    </div>
  );
}
