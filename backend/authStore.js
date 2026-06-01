import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const dataFilePath = process.env.PAPERPANDA_DATA_FILE
  ? path.resolve(process.env.PAPERPANDA_DATA_FILE)
  : path.resolve(process.cwd(), "data", "paperpanda-store.json");

let storeCache = null;
let writeQueue = Promise.resolve();

function createEmptyStore() {
  return {
    users: [],
    sessions: []
  };
}

async function ensureDataFile() {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  try {
    await fs.access(dataFilePath);
  } catch (error) {
    await fs.writeFile(dataFilePath, JSON.stringify(createEmptyStore(), null, 2));
  }
}

async function loadStore() {
  if (storeCache) {
    return storeCache;
  }

  await ensureDataFile();
  try {
    const raw = await fs.readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(raw);
    storeCache = {
      users: Array.isArray(parsed?.users) ? parsed.users : [],
      sessions: Array.isArray(parsed?.sessions) ? parsed.sessions : []
    };
  } catch (error) {
    storeCache = createEmptyStore();
  }

  return storeCache;
}

function queueStoreWrite() {
  writeQueue = writeQueue
    .catch(() => {})
    .then(async () => {
      await ensureDataFile();
      await fs.writeFile(dataFilePath, JSON.stringify(storeCache, null, 2));
    });
  return writeQueue;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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

function normalizeSubjects(subjects) {
  return Array.isArray(subjects) ? subjects : [];
}

function createSessionToken() {
  return randomBytes(32).toString("hex");
}

function getUserByEmail(store, email) {
  const normalizedEmail = normalizeEmail(email);
  return store.users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
}

function getUserById(store, userId) {
  return store.users.find((user) => user.id === userId) || null;
}

export function getDataFilePath() {
  return dataFilePath;
}

export async function registerUser({ name, email, password, grade, subjects = [] }) {
  const store = await loadStore();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    const error = new Error("A school email is required.");
    error.status = 400;
    throw error;
  }

  if (getUserByEmail(store, normalizedEmail)) {
    const error = new Error("That email already has an account. Sign in with the saved password.");
    error.status = 409;
    throw error;
  }

  const { hash, salt } = await hashPassword(password);
  const user = {
    id: randomBytes(16).toString("hex"),
    name: String(name || "").trim(),
    email: normalizedEmail,
    grade: String(grade || "").trim(),
    points: 0,
    passwordHash: hash,
    passwordSalt: salt,
    subjects: normalizeSubjects(subjects),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.users.push(user);

  const token = createSessionToken();
  store.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString()
  });
  await queueStoreWrite();

  return {
    token,
    account: sanitizeAccount(user),
    subjects: normalizeSubjects(user.subjects)
  };
}

export async function signInUser({ email, password }) {
  const store = await loadStore();
  const user = getUserByEmail(store, email);
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

  const token = createSessionToken();
  store.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString()
  });
  user.updatedAt = new Date().toISOString();
  await queueStoreWrite();

  return {
    token,
    account: sanitizeAccount(user),
    subjects: normalizeSubjects(user.subjects)
  };
}

export async function getSessionAccount(token) {
  const store = await loadStore();
  const session = store.sessions.find((entry) => entry.token === token);
  if (!session) {
    return null;
  }

  const user = getUserById(store, session.userId);
  if (!user) {
    store.sessions = store.sessions.filter((entry) => entry.token !== token);
    await queueStoreWrite();
    return null;
  }

  session.lastSeenAt = new Date().toISOString();
  await queueStoreWrite();

  return {
    token,
    account: sanitizeAccount(user),
    subjects: normalizeSubjects(user.subjects)
  };
}

export async function signOutSession(token) {
  const store = await loadStore();
  const previousLength = store.sessions.length;
  store.sessions = store.sessions.filter((session) => session.token !== token);
  if (store.sessions.length !== previousLength) {
    await queueStoreWrite();
  }
}

export async function updateAccount(token, { name, email, grade }) {
  const store = await loadStore();
  const session = store.sessions.find((entry) => entry.token === token);
  if (!session) {
    const error = new Error("Session expired. Sign in again.");
    error.status = 401;
    throw error;
  }

  const user = getUserById(store, session.userId);
  if (!user) {
    const error = new Error("Account could not be found.");
    error.status = 404;
    throw error;
  }

  const normalizedEmail = normalizeEmail(email);
  const emailOwner = getUserByEmail(store, normalizedEmail);
  if (emailOwner && emailOwner.id !== user.id) {
    const error = new Error("That email is already in use.");
    error.status = 409;
    throw error;
  }

  user.name = String(name || "").trim();
  user.email = normalizedEmail;
  user.grade = String(grade || "").trim();
  user.updatedAt = new Date().toISOString();
  await queueStoreWrite();

  return sanitizeAccount(user);
}

export async function updateAccountPassword(token, currentPassword, nextPassword) {
  const store = await loadStore();
  const session = store.sessions.find((entry) => entry.token === token);
  if (!session) {
    const error = new Error("Session expired. Sign in again.");
    error.status = 401;
    throw error;
  }

  const user = getUserById(store, session.userId);
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
  user.passwordHash = hash;
  user.passwordSalt = salt;
  user.updatedAt = new Date().toISOString();
  await queueStoreWrite();
}

export async function updateAccountSubjects(token, subjects) {
  const store = await loadStore();
  const session = store.sessions.find((entry) => entry.token === token);
  if (!session) {
    const error = new Error("Session expired. Sign in again.");
    error.status = 401;
    throw error;
  }

  const user = getUserById(store, session.userId);
  if (!user) {
    const error = new Error("Account could not be found.");
    error.status = 404;
    throw error;
  }

  user.subjects = normalizeSubjects(subjects);
  user.updatedAt = new Date().toISOString();
  await queueStoreWrite();

  return normalizeSubjects(user.subjects);
}

export async function awardAccountPoints(token, points) {
  const store = await loadStore();
  const session = store.sessions.find((entry) => entry.token === token);
  if (!session) {
    const error = new Error("Session expired. Sign in again.");
    error.status = 401;
    throw error;
  }

  const user = getUserById(store, session.userId);
  if (!user) {
    const error = new Error("Account could not be found.");
    error.status = 404;
    throw error;
  }

  user.points = Math.max(0, Number(user.points || 0) || 0) + Math.max(0, Number(points || 0) || 0);
  user.updatedAt = new Date().toISOString();
  await queueStoreWrite();

  return sanitizeAccount(user);
}
