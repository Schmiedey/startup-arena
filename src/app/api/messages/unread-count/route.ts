import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkBanned, bannedResponse } from "@/lib/admin";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ unreadCount: 0 });
  }

  const banCheck = await checkBanned();
  if (banCheck?.banned) return bannedResponse();
  const userId = banCheck!.userId;

  try {
    const result = await sql`
      SELECT COUNT(*) AS count FROM founder_messages
      WHERE recipient_id = ${userId} AND read_at IS NULL
    `;
    return NextResponse.json({ unreadCount: Number(result.rows[0].count) });
  } catch {
    return NextResponse.json({ unreadCount: 0 });
  }
}