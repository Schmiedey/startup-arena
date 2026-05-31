import { sql, type VercelPoolClient } from "@vercel/postgres";

export async function withTransaction<T>(
  work: (client: VercelPoolClient) => Promise<T>
): Promise<T> {
  const client = await sql.connect();

  try {
    await client.sql`BEGIN`;
    const result = await work(client);
    await client.sql`COMMIT`;
    return result;
  } catch (error) {
    await client.sql`ROLLBACK`.catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteIdeaCascade(ideaId: string): Promise<number> {
  return withTransaction(async (client) => {
    await client.sql`
      DELETE FROM votes
      WHERE winner_id = ${ideaId}
        OR battle_id IN (
          SELECT id FROM battles WHERE idea_a_id = ${ideaId} OR idea_b_id = ${ideaId}
        )
    `;
    await client.sql`DELETE FROM comments WHERE idea_id = ${ideaId}`;
    await client.sql`DELETE FROM battles WHERE idea_a_id = ${ideaId} OR idea_b_id = ${ideaId}`;
    const deleted = await client.sql`DELETE FROM ideas WHERE id = ${ideaId}`;
    return deleted.rowCount ?? 0;
  });
}
