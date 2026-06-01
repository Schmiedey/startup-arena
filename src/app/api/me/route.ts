import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ user: null });
  }

  try {
    const userResult = await sql`
      SELECT
        id,
        name,
        email,
        image,
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
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const ideasResult = await sql`
      SELECT COUNT(*) as count FROM ideas WHERE user_id = ${user.id}
    `;
    const votesTodayResult = await sql`
      SELECT COUNT(*) as count FROM votes
      WHERE user_id = ${user.id} AND created_at::date = CURRENT_DATE
    `;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        plan: user.plan === "pro" && (user.subscription_status === "active" || user.subscription_status === "trialing")
          ? "pro"
          : user.launch_pass_purchased_at || user.plan === "launch"
            ? "launch"
            : "free",
        prediction_elo: Number(user.prediction_elo ?? 1000),
        prediction_wins: Number(user.prediction_wins ?? 0),
        prediction_losses: Number(user.prediction_losses ?? 0),
        prediction_streak: Number(user.prediction_streak ?? 0),
        best_prediction_streak: Number(user.best_prediction_streak ?? 0),
      },
      ideas_count: Number(ideasResult.rows[0].count),
      votes_today: Number(votesTodayResult.rows[0].count),
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
