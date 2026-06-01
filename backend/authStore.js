import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import pg from "pg";

const { Pool } = pg;
const scrypt = promisify(scryptCallback);
const databaseUrl = String(process.env.DATABASE_URL || "").trim();
const legacyJsonPath = process.env.PAPERPANDA_DATA_FILE
  ? path.resolve(process.env.PAPERPANDA_DATA_FILE)
  : path.resolve(process.cwd(), "data", "paperpanda-store.json");
const usersTableName = "paperpanda_users";
const sessionsTableName = "paperpanda_sessions";

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000
    })
  : null;

let initializationPromise = null;
let legacyMigrationAttempted = false;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeSubjects(subjects) {
  return Array.isArray(subjects) ? subjects : [];
}

function normalizeAccountSettings(settings) {
  return settings && typeof settings === "object" && !Array.isArray(settings) ? settings : {};
}

function createSessionToken() {
  return randomBytes(32).toString("hex");
}

function sanitizeAccount(user) {
  return {
    id: user.id,
    name: String(user.name || "").trim(),
    email: normalizeEmail(user.email),
    grade: String(user.grade || "").trim(),
    points: Math.max(0, Number(user.points || 0) || 0)
  };
}

async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const derived = await scrypt(String(password || ""), salt, 64);
  return {
    salt,
    hash: Buffer.from(derived).toString("hex")
  };
}

async function verifyPassword(password, passwordHash, passwordSalt) {
  if (!passwordHash || !passwordSalt) {
    return false;
  }

  const derived = await scrypt(String(password || ""), passwordSalt, 64);
  const derivedBuffer = Buffer.from(derived);
  const passwordBuffer = Buffer.from(String(passwordHash), "hex");
  if (derivedBuffer.length !== passwordBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedBuffer, passwordBuffer);
}

function requirePool() {
  if (!pool) {
    const error = new Error("DATABASE_URL is not configured on the backend.");
    error.status = 503;
    throw error;
  }

  return pool;
}

async function maybeMigrateLegacyJson(client) {
  if (legacyMigrationAttempted || !fs.existsSync(legacyJsonPath)) {
    legacyMigrationAttempted = true;
    return;
  }

  const existingUsersResult = await client.query(`SELECT COUNT(*)::int AS count FROM ${usersTableName}`);
  if (Number(existingUsersResult.rows[0]?.count || 0) > 0) {
    legacyMigrationAttempted = true;
    return;
  }

  try {
    const raw = fs.readFileSync(legacyJsonPath, "utf8");
    const parsed = JSON.parse(raw);
    const users = Array.isArray(parsed?.users) ? parsed.users : [];
    const sessions = Array.isArray(parsed?.sessions) ? parsed.sessions : [];

    await client.query("BEGIN");
    for (const user of users) {
      await client.query(
        `
          INSERT INTO ${usersTableName} (
            id,
            name,
            email,
            grade,
            points,
            password_hash,
            password_salt,
            subjects_json,
            settings_json,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11)
          ON CONFLICT (email) DO NOTHING
        `,
        [
          String(user?.id || randomBytes(16).toString("hex")),
          String(user?.name || "").trim(),
          normalizeEmail(user?.email),
          String(user?.grade || "").trim(),
          Math.max(0, Number(user?.points || 0) || 0),
          String(user?.passwordHash || ""),
          String(user?.passwordSalt || ""),
          JSON.stringify(normalizeSubjects(user?.subjects)),
          JSON.stringify(normalizeAccountSettings(user?.settings)),
          user?.createdAt || new Date().toISOString(),
          user?.updatedAt || new Date().toISOString()
        ]
      );
    }

    for (const session of sessions) {
      if (!session?.token || !session?.userId) {
        continue;
      }
      await client.query(
        `
          INSERT INTO ${sessionsTableName} (token, user_id, created_at, last_seen_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (token) DO NOTHING
        `,
        [
          String(session.token),
          String(session.userId),
          session.createdAt || new Date().toISOString(),
          session.lastSeenAt || new Date().toISOString()
        ]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Legacy PaperPanda auth store migration failed.", error);
  } finally {
    legacyMigrationAttempted = true;
  }
}

async function ensureDatabaseReady() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const activePool = requirePool();
      const client = await activePool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${usersTableName} (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            grade TEXT NOT NULL,
            points INTEGER NOT NULL DEFAULT 0,
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL,
            subjects_json JSONB NOT NULL DEFAULT '[]'::jsonb,
            settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
          )
        `);
        await client.query(`
          ALTER TABLE ${usersTableName}
          ADD COLUMN IF NOT EXISTS settings_json JSONB NOT NULL DEFAULT '{}'::jsonb
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${sessionsTableName} (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES ${usersTableName}(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL,
            last_seen_at TIMESTAMPTZ NOT NULL
          )
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS ${sessionsTableName}_user_id_idx
          ON ${sessionsTableName}(user_id)
        `);
        await maybeMigrateLegacyJson(client);
      } finally {
        client.release();
      }
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

async function getUserByEmail(client, email) {
  const result = await client.query(
    `
      SELECT
        id,
        name,
        email,
        grade,
        points,
        password_hash AS "passwordHash",
        password_salt AS "passwordSalt",
        subjects_json AS "subjectsJson",
        settings_json AS "settingsJson",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM ${usersTableName}
      WHERE email = $1
      LIMIT 1
    `,
    [normalizeEmail(email)]
  );

  return result.rows[0] || null;
}

async function getUserById(client, userId) {
  const result = await client.query(
    `
      SELECT
        id,
        name,
        email,
        grade,
        points,
        password_hash AS "passwordHash",
        password_salt AS "passwordSalt",
        subjects_json AS "subjectsJson",
        settings_json AS "settingsJson",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM ${usersTableName}
      WHERE id = $1
      LIMIT 1
    `,
    [String(userId || "")]
  );

  return result.rows[0] || null;
}

function subjectsFromUserRow(user) {
  return normalizeSubjects(user?.subjectsJson);
}

function settingsFromUserRow(user) {
  return normalizeAccountSettings(user?.settingsJson);
}

async function createSessionForUser(client, userId) {
  const token = createSessionToken();
  const now = new Date().toISOString();
  await client.query(
    `
      INSERT INTO ${sessionsTableName} (token, user_id, created_at, last_seen_at)
      VALUES ($1, $2, $3, $4)
    `,
    [token, userId, now, now]
  );
  return token;
}

export function getDataFilePath() {
  return databaseUrl ? "postgres" : "unconfigured";
}

export async function registerUser({ name, email, password, grade, subjects = [], settings = {} }) {
  await ensureDatabaseReady();
  const activePool = requirePool();
  const client = await activePool.connect();

  try {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      const error = new Error("A school email is required.");
      error.status = 400;
      throw error;
    }

    await client.query("BEGIN");
    const existingUser = await getUserByEmail(client, normalizedEmail);
    if (existingUser) {
      await client.query("ROLLBACK");
      const error = new Error("That email already has an account. Sign in with the saved password.");
      error.status = 409;
      throw error;
    }

    const { hash, salt } = await hashPassword(password);
    const userId = randomBytes(16).toString("hex");
    const now = new Date().toISOString();

    await client.query(
      `
        INSERT INTO ${usersTableName} (
          id,
          name,
          email,
          grade,
          points,
          password_hash,
          password_salt,
          subjects_json,
          settings_json,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11)
      `,
      [
        userId,
        String(name || "").trim(),
        normalizedEmail,
        String(grade || "").trim(),
        0,
        hash,
        salt,
        JSON.stringify(normalizeSubjects(subjects)),
        JSON.stringify(normalizeAccountSettings(settings)),
        now,
        now
      ]
    );

    const token = await createSessionForUser(client, userId);
    await client.query("COMMIT");
    const user = await getUserById(client, userId);

    return {
      token,
      account: sanitizeAccount(user),
      subjects: subjectsFromUserRow(user),
      settings: settingsFromUserRow(user)
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {}
    throw error;
  } finally {
    client.release();
  }
}

export async function signInUser({ email, password }) {
  await ensureDatabaseReady();
  const activePool = requirePool();
  const client = await activePool.connect();

  try {
    const user = await getUserByEmail(client, email);
    if (!user) {
      const error = new Error("No account was found for that email. Switch to Create account first.");
      error.status = 404;
      throw error;
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!passwordMatches) {
      const error = new Error("That password is incorrect.");
      error.status = 401;
      throw error;
    }

    await client.query("BEGIN");
    const now = new Date().toISOString();
    await client.query(`UPDATE ${usersTableName} SET updated_at = $1 WHERE id = $2`, [now, user.id]);
    const token = await createSessionForUser(client, user.id);
    await client.query("COMMIT");
    const refreshedUser = await getUserById(client, user.id);

    return {
      token,
      account: sanitizeAccount(refreshedUser),
      subjects: subjectsFromUserRow(refreshedUser),
      settings: settingsFromUserRow(refreshedUser)
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {}
    throw error;
  } finally {
    client.release();
  }
}

export async function getSessionAccount(token) {
  await ensureDatabaseReady();
  const activePool = requirePool();
  const client = await activePool.connect();

  try {
    const sessionResult = await client.query(
      `
        SELECT token, user_id AS "userId"
        FROM ${sessionsTableName}
        WHERE token = $1
        LIMIT 1
      `,
      [String(token || "")]
    );
    const session = sessionResult.rows[0];
    if (!session) {
      return null;
    }

    const user = await getUserById(client, session.userId);
    if (!user) {
      await client.query(`DELETE FROM ${sessionsTableName} WHERE token = $1`, [String(token || "")]);
      return null;
    }

    await client.query(`UPDATE ${sessionsTableName} SET last_seen_at = $1 WHERE token = $2`, [
      new Date().toISOString(),
      String(token || "")
    ]);

    return {
      token: String(token || ""),
      account: sanitizeAccount(user),
      subjects: subjectsFromUserRow(user),
      settings: settingsFromUserRow(user)
    };
  } finally {
    client.release();
  }
}

export async function signOutSession(token) {
  await ensureDatabaseReady();
  await requirePool().query(`DELETE FROM ${sessionsTableName} WHERE token = $1`, [String(token || "")]);
}

export async function updateAccount(token, { name, email, grade }) {
  await ensureDatabaseReady();
  const activePool = requirePool();
  const client = await activePool.connect();

  try {
    const sessionResult = await client.query(
      `SELECT user_id AS "userId" FROM ${sessionsTableName} WHERE token = $1 LIMIT 1`,
      [String(token || "")]
    );
    const session = sessionResult.rows[0];
    if (!session) {
      const error = new Error("Session expired. Sign in again.");
      error.status = 401;
      throw error;
    }

    const user = await getUserById(client, session.userId);
    if (!user) {
      const error = new Error("Account could not be found.");
      error.status = 404;
      throw error;
    }

    const normalizedEmail = normalizeEmail(email);
    const emailOwner = await getUserByEmail(client, normalizedEmail);
    if (emailOwner && emailOwner.id !== user.id) {
      const error = new Error("That email is already in use.");
      error.status = 409;
      throw error;
    }

    await client.query(
      `UPDATE ${usersTableName} SET name = $1, email = $2, grade = $3, updated_at = $4 WHERE id = $5`,
      [String(name || "").trim(), normalizedEmail, String(grade || "").trim(), new Date().toISOString(), user.id]
    );

    return sanitizeAccount(await getUserById(client, user.id));
  } finally {
    client.release();
  }
}

export async function updateAccountPassword(token, currentPassword, nextPassword) {
  await ensureDatabaseReady();
  const activePool = requirePool();
  const client = await activePool.connect();

  try {
    const sessionResult = await client.query(
      `SELECT user_id AS "userId" FROM ${sessionsTableName} WHERE token = $1 LIMIT 1`,
      [String(token || "")]
    );
    const session = sessionResult.rows[0];
    if (!session) {
      const error = new Error("Session expired. Sign in again.");
      error.status = 401;
      throw error;
    }

    const user = await getUserById(client, session.userId);
    if (!user) {
      const error = new Error("Account could not be found.");
      error.status = 404;
      throw error;
    }

    const matches = await verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
    if (!matches) {
      const error = new Error("Current password is incorrect.");
      error.status = 400;
      throw error;
    }

    const { hash, salt } = await hashPassword(nextPassword);
    await client.query(
      `UPDATE ${usersTableName} SET password_hash = $1, password_salt = $2, updated_at = $3 WHERE id = $4`,
      [hash, salt, new Date().toISOString(), user.id]
    );
  } finally {
    client.release();
  }
}

export async function updateAccountSubjects(token, subjects) {
  await ensureDatabaseReady();
  const activePool = requirePool();
  const client = await activePool.connect();

  try {
    const sessionResult = await client.query(
      `SELECT user_id AS "userId" FROM ${sessionsTableName} WHERE token = $1 LIMIT 1`,
      [String(token || "")]
    );
    const session = sessionResult.rows[0];
    if (!session) {
      const error = new Error("Session expired. Sign in again.");
      error.status = 401;
      throw error;
    }

    const user = await getUserById(client, session.userId);
    if (!user) {
      const error = new Error("Account could not be found.");
      error.status = 404;
      throw error;
    }

    await client.query(
      `UPDATE ${usersTableName} SET subjects_json = $1::jsonb, updated_at = $2 WHERE id = $3`,
      [JSON.stringify(normalizeSubjects(subjects)), new Date().toISOString(), user.id]
    );

    return normalizeSubjects(subjects);
  } finally {
    client.release();
  }
}

export async function awardAccountPoints(token, points) {
  await ensureDatabaseReady();
  const activePool = requirePool();
  const client = await activePool.connect();

  try {
    const sessionResult = await client.query(
      `SELECT user_id AS "userId" FROM ${sessionsTableName} WHERE token = $1 LIMIT 1`,
      [String(token || "")]
    );
    const session = sessionResult.rows[0];
    if (!session) {
      const error = new Error("Session expired. Sign in again.");
      error.status = 401;
      throw error;
    }

    const user = await getUserById(client, session.userId);
    if (!user) {
      const error = new Error("Account could not be found.");
      error.status = 404;
      throw error;
    }

    const nextPoints = Math.max(0, Number(user.points || 0) || 0) + Math.max(0, Number(points || 0) || 0);
    await client.query(`UPDATE ${usersTableName} SET points = $1, updated_at = $2 WHERE id = $3`, [
      nextPoints,
      new Date().toISOString(),
      user.id
    ]);

    return sanitizeAccount(await getUserById(client, user.id));
  } finally {
    client.release();
  }
}

export async function updateAccountSettings(token, settings) {
  await ensureDatabaseReady();
  const activePool = requirePool();
  const client = await activePool.connect();

  try {
    const sessionResult = await client.query(
      `SELECT user_id AS "userId" FROM ${sessionsTableName} WHERE token = $1 LIMIT 1`,
      [String(token || "")]
    );
    const session = sessionResult.rows[0];
    if (!session) {
      const error = new Error("Session expired. Sign in again.");
      error.status = 401;
      throw error;
    }

    const user = await getUserById(client, session.userId);
    if (!user) {
      const error = new Error("Account could not be found.");
      error.status = 404;
      throw error;
    }

    const normalizedSettings = normalizeAccountSettings(settings);
    await client.query(
      `UPDATE ${usersTableName} SET settings_json = $1::jsonb, updated_at = $2 WHERE id = $3`,
      [JSON.stringify(normalizedSettings), new Date().toISOString(), user.id]
    );

    return normalizedSettings;
  } finally {
    client.release();
  }
}
