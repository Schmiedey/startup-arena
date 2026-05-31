import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET() {
  try {
    const [ideas, votes, battles] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM ideas`,
      sql`SELECT COUNT(*) as count FROM votes`,
      sql`SELECT COUNT(*) as count FROM battles`,
    ]);

    return NextResponse.json({
      ideas: Number(ideas.rows[0].count),
      votes: Number(votes.rows[0].count),
      battles: Number(battles.rows[0].count),
    });
  } catch {
    return NextResponse.json({ ideas: 0, votes: 0, battles: 0 });
  }
}