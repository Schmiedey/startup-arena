import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { sql } from "@vercel/postgres";
import { trackEvent } from "@/lib/analytics";
import { likelyrAuthAdapter } from "@/lib/auth-adapter";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import { isGmailEmailConfigured, sendSignInEmail } from "@/lib/email";
import { normalizeEmail, verifyPassword } from "@/lib/password-auth";

const gmailEmailConfigured = isGmailEmailConfigured();
const emailProvider = {
  id: "email",
  type: "email" as const,
  name: "Email",
  from: process.env.GMAIL_SENDER_EMAIL ? `Likelyr <${process.env.GMAIL_SENDER_EMAIL}>` : "Likelyr",
  maxAge: 15 * 60,
  async sendVerificationRequest({ identifier, url }: { identifier: string; url: string }) {
    await sendSignInEmail({ to: identifier, url });
  },
};

const credentialsProvider = Credentials({
  id: "credentials",
  name: "Email and password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const email = normalizeEmail(credentials?.email);
    const password = typeof credentials?.password === "string" ? credentials.password : "";
    if (!email || !password) return null;

    const result = await sql`
      SELECT id, name, email, image, password_hash, email_verified_at
      FROM users
      WHERE email = ${email}
    `;
    const user = result.rows[0] as
      | {
          id: string;
          name: string | null;
          email: string;
          image: string | null;
          password_hash: string | null;
          email_verified_at: Date | string | null;
        }
      | undefined;

    if (!user?.password_hash) return null;
    if (!user.email_verified_at) return null;
    if (!(await verifyPassword(password, user.password_hash))) return null;

    return {
      id: user.id,
      name: user.name ?? "Anonymous",
      email: user.email,
      image: user.image,
    };
  },
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: gmailEmailConfigured ? likelyrAuthAdapter : undefined,
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [Google({ allowDangerousEmailAccountLinking: true }), credentialsProvider, ...(gmailEmailConfigured ? [emailProvider] : [])],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      return `${baseUrl}${safeAuthRedirect(url, baseUrl)}`;
    },
    async signIn({ user, account }) {
      const email = normalizeEmail(user.email);
      if (!email) return false;
      try {
        const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
        let userId: string | null = null;
        let isNewUser = false;
        if (existing.rows.length === 0) {
          const created = await sql`
            INSERT INTO users (name, email, image)
            VALUES (${user.name ?? "Anonymous"}, ${email}, ${user.image ?? null})
            RETURNING id
          `;
          userId = created.rows[0]?.id ?? null;
          isNewUser = true;
        } else {
          const updated = await sql`
            UPDATE users SET name = COALESCE(${user.name}, name), image = COALESCE(${user.image}, image)
            WHERE email = ${email}
            RETURNING id
          `;
          userId = updated.rows[0]?.id ?? existing.rows[0]?.id ?? null;
        }
        void trackEvent({
          name: isNewUser ? "user_signed_up" : "user_signed_in",
          userId,
          path: "/api/auth",
          metadata: { provider: account?.provider ?? "unknown" },
        }).catch((error) => {
          console.error("Error tracking sign in:", error);
        });
      } catch (error) {
        console.error("Error in signIn callback:", error);
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        try {
          const result = await sql`
            SELECT
              id,
              name,
              image,
              is_admin,
              plan,
              subscription_status,
              launch_pass_purchased_at,
              prediction_elo,
              prediction_wins,
              prediction_losses,
              prediction_streak,
              best_prediction_streak
            FROM users
            WHERE email = ${session.user.email}
          `;
          if (result.rows.length > 0) {
            const row = result.rows[0];
            (session.user as { id?: string }).id = result.rows[0].id;
            (session.user as { name?: string }).name = row.name;
            (session.user as { image?: string }).image = row.image;
            (session.user as { isAdmin?: boolean }).isAdmin = row.is_admin;
            session.user.predictionElo = Number(row.prediction_elo ?? 1000);
            session.user.predictionWins = Number(row.prediction_wins ?? 0);
            session.user.predictionLosses = Number(row.prediction_losses ?? 0);
            session.user.predictionStreak = Number(row.prediction_streak ?? 0);
            session.user.bestPredictionStreak = Number(row.best_prediction_streak ?? 0);
            (session.user as { plan?: "free" | "launch" | "pro" }).plan =
              row.plan === "pro" && (row.subscription_status === "active" || row.subscription_status === "trialing")
                ? "pro"
                : row.launch_pass_purchased_at || row.plan === "launch"
                  ? "launch"
                  : "free";
          }
        } catch (error) {
          console.error("Error in session callback:", error);
        }
      }
      return session;
    },
  },
});
