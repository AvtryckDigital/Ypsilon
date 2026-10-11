#!/usr/bin/env node
// Skapar ett admin-konto (eller byter lösenord på ett befintligt).
//
//   npm run admin:create -- namn@exempel.se                 lokal databas, slumpat lösenord
//   npm run admin:create -- namn@exempel.se "MittLösen123"  lokal databas, eget lösenord
//   npm run admin:create -- namn@exempel.se --remote        produktionsdatabasen på Cloudflare
//
// Lösenordet hashas på samma sätt som i src/lib/password.ts (PBKDF2-SHA256, 100 000 varv).

import { execSync } from "node:child_process";
import { webcrypto as crypto } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const remote = args.includes("--remote");
const [email, givenPassword] = args.filter((a) => !a.startsWith("--"));

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Ange en e-postadress: npm run admin:create -- namn@exempel.se [lösenord] [--remote]");
  process.exit(1);
}

function randomPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => chars[b % chars.length]).join("");
}

const password = givenPassword ?? randomPassword();
if (password.length < 10) {
  console.error("Lösenordet måste ha minst 10 tecken.");
  process.exit(1);
}

const ITERATIONS = 100_000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, key, 256));
const b64 = (u8) => Buffer.from(u8).toString("base64");
const hash = `pbkdf2_sha256$${ITERATIONS}$${b64(salt)}$${b64(bits)}`;

const q = (s) => `'${s.replace(/'/g, "''")}'`;
const sql =
  `INSERT INTO users (email, password_hash) VALUES (${q(email.toLowerCase())}, ${q(hash)}) ` +
  `ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash;`;

// SQL:en skrivs till en fil så att inga tecken i lösenordshashen tolkas av terminalen.
const dir = mkdtempSync(join(tmpdir(), "ypsilon-"));
const file = join(dir, "admin.sql");
writeFileSync(file, sql);
const command = `npx wrangler d1 execute ypsilon-db ${remote ? "--remote" : "--local"} --yes --file="${file}"`;
try {
  execSync(command, { stdio: ["ignore", "ignore", "inherit"] });
} catch {
  console.error("\nKunde inte spara kontot. Har databasen skapats och migrerats? Kör först: npm run db:migrate:" + (remote ? "remote" : "local"));
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
if (process.exitCode) process.exit();

console.log(`\nKontot är klart (${remote ? "produktion" : "lokalt"}).`);
console.log(`  E-post:   ${email.toLowerCase()}`);
if (!givenPassword) console.log(`  Lösenord: ${password}\n  Spara lösenordet nu, det visas inte igen. Det kan bytas under Mitt konto.`);
