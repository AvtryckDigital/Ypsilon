// Lösenordshashning med PBKDF2-SHA256 via Web Crypto.
// Fungerar både i Cloudflare Workers och i Node (används av scripts/create-admin.mjs).
// 100 000 iterationer är det högsta Cloudflare Workers tillåter.

const ITERATIONS = 100_000;
const enc = new TextEncoder();

function toB64(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(b64: string) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2_sha256$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, iter, saltB64, hashB64] = stored.split("$");
  if (algo !== "pbkdf2_sha256" || !iter || !saltB64 || !hashB64) return false;
  const expected = fromB64(hashB64);
  const actual = await derive(password, fromB64(saltB64), Number(iter));
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

export async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const MIN_PASSWORD_LENGTH = 10;
