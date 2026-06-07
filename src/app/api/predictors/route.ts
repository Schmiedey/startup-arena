import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { getPredictionAccuracy } from "@/lib/prediction";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));

  try {
    const result = await sql`
      SELECT
        id,
        name,
        image,
        COALESCE(is_bot, false) AS is_bot,
        prediction_elo,
        prediction_wins,
        prediction_losses,
        prediction_streak,
        best_prediction_streak,
        (prediction_wins + prediction_losses)::int AS guesses
      FROM users
      WHERE (prediction_wins + prediction_losses) > 0
        AND COALESCE(is_bot, false) = false
        AND COALESCE(is_admin, false) = false
      ORDER BY prediction_elo DESC, prediction_wins DESC, best_prediction_streak DESC
      LIMIT ${limit}
    `;

    return NextResponse.json(
      result.rows.map((row) => ({
        ...row,
        prediction_elo: Number(row.prediction_elo),
        prediction_wins: Number(row.prediction_wins),
        prediction_losses: Number(row.prediction_losses),
        prediction_streak: Number(row.prediction_streak),
        best_prediction_streak: Number(row.best_prediction_streak),
        is_bot: Boolean(row.is_bot),
        guesses: Number(row.guesses),
        accuracy: getPredictionAccuracy(Number(row.prediction_wins), Number(row.prediction_losses)),
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load predictors";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
