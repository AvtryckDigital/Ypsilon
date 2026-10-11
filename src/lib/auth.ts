import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { first, run } from "./db";
import { randomToken, sha256Hex, verifyPassword } from "./password";
import type { User } from "./types";

const COOKIE = "ypsa_session";
const SESSION_DAYS = 30;
const MAX_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

async function clientKey() {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "lokal";
  return `login:${ip}`;
}

/** Returnerar ett felmeddelande om IP-adressen har gjort för många försök. */
async function checkRateLimit(key: string) {
  const row = await first<{ count: number; first_at: number }>(
    "SELECT count, first_at FROM login_attempts WHERE key = ?", key,
  );
  if (row && Date.now() - row.first_at < ATTEMPT_WINDOW_MS && row.count >= MAX_ATTEMPTS) {
    return "För många inloggningsförsök. Vänta en kvart och försök igen.";
  }
  return null;
}

async function recordFailure(key: string) {
  const now = Date.now();
  await run(
    `INSERT INTO login_attempts (key, count, first_at) VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN ? - first_at > ? THEN 1 ELSE count + 1 END,
       first_at = CASE WHEN ? - first_at > ? THEN ? ELSE first_at END`,
    key, now, now, ATTEMPT_WINDOW_MS, now, ATTEMPT_WINDOW_MS, now,
  );
}

export async function login(email: string, password: string): Promise<string | null> {
  const key = await clientKey();
  const limited = await checkRateLimit(key);
  if (limited) return limited;

  const user = await first<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = ?", email.trim(),
  );
  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) {
    await recordFailure(key);
    return "Fel e-postadress eller lösenord.";
  }

  await run("DELETE FROM login_attempts WHERE key = ?", key);
  await run("DELETE FROM sessions WHERE expires_at < ?", Date.now());

  const token = randomToken();
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", await sha256Hex(token), user.id, expires);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
  return null;
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE id = ?", await sha256Hex(token));
  jar.delete(COOKIE);
}

/** Inloggad användare, eller null. */
export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  // TILLFÄLLIGT: öppen admin vid lokal utveckling (npm run dev). Ta bort före commit.
  if (!token && process.env.NODE_ENV === "development") {
    return first<User>("SELECT id, email, name FROM users ORDER BY id LIMIT 1");
  }
  if (!token) return null;
  return first<User>(
    `SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?`,
    await sha256Hex(token), Date.now(),
  );
}

/** Används i alla admin-sidor och admin-åtgärder. Skickar utloggade till inloggningen. */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Loggar ut användarens alla andra sessioner, t.ex. efter byte av lösenord. */
export async function endOtherSessions(userId: number) {
  const token = (await cookies()).get(COOKIE)?.value;
  const current = token ? await sha256Hex(token) : "";
  await run("DELETE FROM sessions WHERE user_id = ? AND id != ?", userId, current);
}
