import { sql } from "@vercel/postgres";
import type { Adapter, AdapterAccount, AdapterSession, AdapterUser, VerificationToken } from "next-auth/adapters";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  email_verified_at?: string | Date | null;
}

interface AccountRow {
  user_id: string;
  type: AdapterAccount["type"];
  provider: string;
  provider_account_id: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
}

interface SessionRow {
  session_token: string;
  user_id: string;
  expires: string | Date;
}

function toAdapterUser(row: UserRow): AdapterUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.email_verified_at ? new Date(row.email_verified_at) : null,
    image: row.image,
  };
}

function toAdapterAccount(row: AccountRow): AdapterAccount {
  return {
    userId: row.user_id,
    type: row.type,
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    refresh_token: row.refresh_token ?? undefined,
    access_token: row.access_token ?? undefined,
    expires_at: row.expires_at ?? undefined,
    token_type: row.token_type?.toLowerCase() as Lowercase<string> | undefined,
    scope: row.scope ?? undefined,
    id_token: row.id_token ?? undefined,
    session_state: row.session_state ?? undefined,
  };
}

function toAdapterSession(row: SessionRow): AdapterSession {
  return {
    sessionToken: row.session_token,
    userId: row.user_id,
    expires: new Date(row.expires),
  };
}

export const likelyrAuthAdapter: Adapter = {
  async createUser(user) {
    const emailVerified = user.emailVerified?.toISOString() ?? null;
    const result = await sql`
      INSERT INTO users (name, email, image, email_verified_at)
      VALUES (${user.name ?? "Anonymous"}, ${user.email}, ${user.image ?? null}, ${emailVerified})
      ON CONFLICT (email)
      DO UPDATE SET
        name = COALESCE(EXCLUDED.name, users.name),
        image = COALESCE(EXCLUDED.image, users.image),
        email_verified_at = COALESCE(EXCLUDED.email_verified_at, users.email_verified_at)
      RETURNING id, name, email, image, email_verified_at
    `;
    return toAdapterUser(result.rows[0] as UserRow);
  },

  async getUser(id) {
    const result = await sql`
      SELECT id, name, email, image, email_verified_at
      FROM users
      WHERE id = ${id}
    `;
    const user = result.rows[0] as UserRow | undefined;
    return user ? toAdapterUser(user) : null;
  },

  async getUserByEmail(email) {
    const result = await sql`
      SELECT id, name, email, image, email_verified_at
      FROM users
      WHERE email = ${email}
    `;
    const user = result.rows[0] as UserRow | undefined;
    return user ? toAdapterUser(user) : null;
  },

  async getUserByAccount({ provider, providerAccountId }) {
    const result = await sql`
      SELECT u.id, u.name, u.email, u.image, u.email_verified_at
      FROM users u
      JOIN accounts a ON a.user_id = u.id
      WHERE a.provider = ${provider} AND a.provider_account_id = ${providerAccountId}
    `;
    const user = result.rows[0] as UserRow | undefined;
    return user ? toAdapterUser(user) : null;
  },

  async updateUser(user) {
    const emailVerified = user.emailVerified?.toISOString() ?? null;
    const result = await sql`
      UPDATE users
      SET
        name = COALESCE(${user.name ?? null}, name),
        email = COALESCE(${user.email ?? null}, email),
        image = COALESCE(${user.image ?? null}, image),
        email_verified_at = COALESCE(${emailVerified}, email_verified_at)
      WHERE id = ${user.id}
      RETURNING id, name, email, image, email_verified_at
    `;
    return toAdapterUser(result.rows[0] as UserRow);
  },

  async linkAccount(account) {
    const result = await sql`
      INSERT INTO accounts (
        user_id,
        type,
        provider,
        provider_account_id,
        refresh_token,
        access_token,
        expires_at,
        token_type,
        scope,
        id_token,
        session_state
      )
      VALUES (
        ${account.userId},
        ${account.type},
        ${account.provider},
        ${account.providerAccountId},
        ${account.refresh_token ?? null},
        ${account.access_token ?? null},
        ${account.expires_at ?? null},
        ${account.token_type ?? null},
        ${account.scope ?? null},
        ${account.id_token ?? null},
        ${typeof account.session_state === "string" ? account.session_state : null}
      )
      ON CONFLICT (provider, provider_account_id)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        expires_at = EXCLUDED.expires_at,
        refresh_token = COALESCE(EXCLUDED.refresh_token, accounts.refresh_token),
        id_token = EXCLUDED.id_token,
        scope = EXCLUDED.scope,
        session_state = EXCLUDED.session_state,
        token_type = EXCLUDED.token_type
      RETURNING user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
    `;
    return toAdapterAccount(result.rows[0] as AccountRow);
  },

  async getAccount(providerAccountId, provider) {
    const result = await sql`
      SELECT user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
      FROM accounts
      WHERE provider = ${provider} AND provider_account_id = ${providerAccountId}
    `;
    const account = result.rows[0] as AccountRow | undefined;
    return account ? toAdapterAccount(account) : null;
  },

  async createSession(session) {
    const expires = session.expires.toISOString();
    const result = await sql`
      INSERT INTO sessions (session_token, user_id, expires)
      VALUES (${session.sessionToken}, ${session.userId}, ${expires})
      RETURNING session_token, user_id, expires
    `;
    return toAdapterSession(result.rows[0] as SessionRow);
  },

  async getSessionAndUser(sessionToken) {
    const result = await sql`
      SELECT
        s.session_token,
        s.user_id,
        s.expires,
        u.id,
        u.name,
        u.email,
        u.image,
        u.email_verified_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
    `;
    const row = result.rows[0] as (SessionRow & UserRow) | undefined;
    if (!row) return null;
    return {
      session: toAdapterSession(row),
      user: toAdapterUser(row),
    };
  },

  async updateSession(session) {
    const expires = session.expires?.toISOString() ?? null;
    const result = await sql`
      UPDATE sessions
      SET expires = COALESCE(${expires}, expires)
      WHERE session_token = ${session.sessionToken}
      RETURNING session_token, user_id, expires
    `;
    const row = result.rows[0] as SessionRow | undefined;
    return row ? toAdapterSession(row) : null;
  },

  async deleteSession(sessionToken) {
    const result = await sql`
      DELETE FROM sessions
      WHERE session_token = ${sessionToken}
      RETURNING session_token, user_id, expires
    `;
    const row = result.rows[0] as SessionRow | undefined;
    return row ? toAdapterSession(row) : null;
  },

  async createVerificationToken(token) {
    const expires = token.expires.toISOString();
    const result = await sql`
      INSERT INTO verification_tokens (identifier, token, expires)
      VALUES (${token.identifier}, ${token.token}, ${expires})
      RETURNING identifier, token, expires
    `;
    return result.rows[0] as VerificationToken;
  },

  async useVerificationToken({ identifier, token }) {
    const result = await sql`
      DELETE FROM verification_tokens
      WHERE identifier = ${identifier} AND token = ${token}
      RETURNING identifier, token, expires
    `;
    const row = result.rows[0] as VerificationToken | undefined;
    return row ?? null;
  },
};
