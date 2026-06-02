import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { requireAdmin, adminDenied } from "@/lib/admin";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;

  try {
    let users, realCount, recordCount, botCount;
    if (search) {
      const searchPattern = `%${search}%`;
      [users, realCount, recordCount, botCount] = await Promise.all([
        sql`SELECT u.id, u.name, u.email, u.image, u.is_admin, u.banned, COALESCE(u.is_bot, false) AS is_bot, u.created_at,
            COUNT(DISTINCT i.id) as ideas_count,
            COALESCE(SUM(i.wins), 0) as total_wins,
            COALESCE(SUM(i.losses), 0) as total_losses,
            (SELECT COUNT(*) FROM votes WHERE user_id = u.id) as votes_cast
            FROM users u
            LEFT JOIN ideas i ON u.id = i.user_id
            WHERE u.name ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern}
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT ${limit} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM users WHERE COALESCE(is_bot, false) = false AND COALESCE(is_admin, false) = false AND (name ILIKE ${searchPattern} OR email ILIKE ${searchPattern})`,
        sql`SELECT COUNT(*) as count FROM users WHERE name ILIKE ${searchPattern} OR email ILIKE ${searchPattern}`,
        sql`SELECT COUNT(*) as count FROM users WHERE COALESCE(is_bot, false) = true AND (name ILIKE ${searchPattern} OR email ILIKE ${searchPattern})`,
      ]);
    } else {
      [users, realCount, recordCount, botCount] = await Promise.all([
        sql`SELECT u.id, u.name, u.email, u.image, u.is_admin, u.banned, COALESCE(u.is_bot, false) AS is_bot, u.created_at,
            COUNT(DISTINCT i.id) as ideas_count,
            COALESCE(SUM(i.wins), 0) as total_wins,
            COALESCE(SUM(i.losses), 0) as total_losses,
            (SELECT COUNT(*) FROM votes WHERE user_id = u.id) as votes_cast
            FROM users u
            LEFT JOIN ideas i ON u.id = i.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT ${limit} OFFSET ${offset}`,
        sql`SELECT COUNT(*) as count FROM users WHERE COALESCE(is_bot, false) = false AND COALESCE(is_admin, false) = false`,
        sql`SELECT COUNT(*) as count FROM users`,
        sql`SELECT COUNT(*) as count FROM users WHERE COALESCE(is_bot, false) = true`,
      ]);
    }

    return NextResponse.json({
      users: users.rows,
      total: Number(realCount.rows[0].count),
      botTotal: Number(botCount.rows[0].count),
      totalRecords: Number(recordCount.rows[0].count),
      page,
      totalPages: Math.ceil(Number(recordCount.rows[0].count) / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  const { userId, is_admin, banned } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  if (userId === admin.id && (is_admin === false || banned === true)) {
    return NextResponse.json({ error: "Cannot demote or ban yourself" }, { status: 400 });
  }

  try {
    if (is_admin !== undefined) {
      await sql`UPDATE users SET is_admin = ${is_admin ?? false} WHERE id = ${userId}`;
    }
    if (banned !== undefined) {
      await sql`UPDATE users SET banned = ${banned ?? false} WHERE id = ${userId}`;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return adminDenied();

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  if (userId === admin.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  try {
    await sql`DELETE FROM users WHERE id = ${userId}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
