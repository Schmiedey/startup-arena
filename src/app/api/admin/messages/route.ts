import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { requireAdmin, adminDenied } from "@/lib/admin";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;

  try {
    const [messages, count] = await Promise.all([
      sql`SELECT m.id, m.body, m.created_at, m.read_at,
          su.id AS sender_id, su.name AS sender_name, su.email AS sender_email, su.image AS sender_image,
          ru.id AS recipient_id, ru.name AS recipient_name, ru.email AS recipient_email, ru.image AS recipient_image
          FROM founder_messages m
          JOIN users su ON m.sender_id = su.id
          JOIN users ru ON m.recipient_id = ru.id
          ORDER BY m.created_at DESC
          LIMIT ${limit} OFFSET ${offset}`,
      sql`SELECT COUNT(*) AS count FROM founder_messages`,
    ]);

    return NextResponse.json({
      messages: messages.rows,
      total: Number(count.rows[0].count),
      page,
      totalPages: Math.ceil(Number(count.rows[0].count) / limit),
    });
  } catch (error) {
    console.error("Admin messages list error:", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("messageId");
  if (!messageId) return NextResponse.json({ error: "messageId required" }, { status: 400 });

  try {
    await sql`DELETE FROM founder_messages WHERE id = ${messageId}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin message delete error:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}