import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { sql } from "@vercel/postgres";
import { trackEvent } from "@/lib/analytics";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub, Google],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      try {
        const existing = await sql`SELECT id FROM users WHERE email = ${user.email}`;
        let userId: string | null = null;
        let isNewUser = false;
        if (existing.rows.length === 0) {
          const created = await sql`
            INSERT INTO users (name, email, image)
            VALUES (${user.name ?? "Anonymous"}, ${user.email}, ${user.image ?? null})
            RETURNING id
          `;
          userId = created.rows[0]?.id ?? null;
          isNewUser = true;
        } else {
          const updated = await sql`
            UPDATE users SET name = COALESCE(${user.name}, name), image = COALESCE(${user.image}, image)
            WHERE email = ${user.email}
            RETURNING id
          `;
          userId = updated.rows[0]?.id ?? existing.rows[0]?.id ?? null;
        }
        await trackEvent({
          name: isNewUser ? "user_signed_up" : "user_signed_in",
          userId,
          path: "/api/auth",
          metadata: { provider: account?.provider ?? "unknown" },
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
