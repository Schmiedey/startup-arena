import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkBanned, bannedResponse } from "@/lib/admin";
import { rateLimit, rateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to view messages" }, { status: 401 });
  }

  const banCheck = await checkBanned();
  if (banCheck?.banned) return bannedResponse();
  const userId = banCheck!.userId;

  const { searchParams } = new URL(request.url);
  const with_user = searchParams.get("with");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  try {
    if (with_user) {
      const messages = await sql`
        SELECT m.id, m.sender_id, m.recipient_id, m.body, m.read_at, m.created_at,
               su.name AS sender_name, su.image AS sender_image,
               ru.name AS recipient_name, ru.image AS recipient_image
        FROM founder_messages m
        JOIN users su ON m.sender_id = su.id
        JOIN users ru ON m.recipient_id = ru.id
        WHERE (m.sender_id = ${userId} AND m.recipient_id = ${with_user})
           OR (m.sender_id = ${with_user} AND m.recipient_id = ${userId})
        ORDER BY m.created_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `;

      await sql`
        UPDATE founder_messages
        SET read_at = NOW()
        WHERE recipient_id = ${userId} AND sender_id = ${with_user} AND read_at IS NULL
      `;

      return NextResponse.json({ messages: messages.rows });
    }

    const conversations = await sql`
      SELECT DISTINCT ON (other_user_id)
        m.id, m.body, m.created_at, m.read_at, m.sender_id,
        other.id AS other_user_id, other.name AS other_user_name, other.image AS other_user_image
      FROM (
        SELECT
          CASE WHEN sender_id = ${userId} THEN recipient_id ELSE sender_id END AS other_user_id,
          id, body, created_at, read_at, sender_id,
          ROW_NUMBER() OVER (
            PARTITION BY CASE WHEN sender_id = ${userId} THEN recipient_id ELSE sender_id END
            ORDER BY created_at DESC
          ) AS rn
        FROM founder_messages
        WHERE sender_id = ${userId} OR recipient_id = ${userId}
      ) m
      JOIN users other ON m.other_user_id = other.id
      WHERE m.rn = 1
      ORDER BY m.created_at DESC
    `;

    const unreadCount = await sql`
      SELECT COUNT(*) AS count FROM founder_messages
      WHERE recipient_id = ${userId} AND read_at IS NULL
    `;

    return NextResponse.json({
      conversations: conversations.rows,
      unreadCount: Number(unreadCount.rows[0].count),
    });
  } catch (error) {
    console.error("Messages list error:", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to send messages" }, { status: 401 });
  }

  const banCheck = await checkBanned();
  if (banCheck?.banned) return bannedResponse();
  const userId = banCheck!.userId;

  const limited = await rateLimit(request, {
    name: "message_send",
    limit: 20,
    windowSeconds: 3600,
    identity: rateLimitIdentity(request, userId),
  });
  if (!limited.ok) return rateLimitResponse(limited, "Slow down. Try again in a minute.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;

  const recipientId = typeof payload.recipient_id === "string" ? payload.recipient_id.trim() : "";
  if (!recipientId) {
    return NextResponse.json({ error: "Recipient is required" }, { status: 400 });
  }

  const messageText = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!messageText) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }
  if (messageText.length > 2000) {
    return NextResponse.json({ error: "Message must be 2000 characters or fewer" }, { status: 400 });
  }

  if (recipientId === userId) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  try {
    const recipient = await sql`SELECT id, name FROM users WHERE id = ${recipientId}`;
    if (!recipient.rows.length) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    const recentCount = await sql`
      SELECT COUNT(*) AS count FROM founder_messages
      WHERE sender_id = ${userId} AND created_at > NOW() - INTERVAL '1 minute'
    `;
    if (Number(recentCount.rows[0].count) >= 5) {
      return NextResponse.json({ error: "Slow down. You're sending messages too fast." }, { status: 429 });
    }

    const message = await sql`
      INSERT INTO founder_messages (sender_id, recipient_id, body)
      VALUES (${userId}, ${recipientId}, ${messageText})
      RETURNING id, sender_id, recipient_id, body, read_at, created_at
    `;

    return NextResponse.json({ message: message.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to update messages" }, { status: 401 });
  }

  const banCheck = await checkBanned();
  if (banCheck?.banned) return bannedResponse();
  const userId = banCheck!.userId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;

  const markAllFrom = typeof payload.mark_read_from === "string" ? payload.mark_read_from.trim() : "";
  if (!markAllFrom) {
    return NextResponse.json({ error: "mark_read_from is required" }, { status: 400 });
  }

  try {
    await sql`
      UPDATE founder_messages
      SET read_at = NOW()
      WHERE recipient_id = ${userId} AND sender_id = ${markAllFrom} AND read_at IS NULL
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Message read error:", error);
    return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 });
  }
}