#!/usr/bin/env node
/**
 * Flyttar innehåll från den gamla WordPress-sajten (ypsa.se) till den nya sajten.
 *
 *   npm run migrate -- --dry-run                 Förhandsgranska nyheterna som Markdown, inget sparas
 *   npm run migrate                              Allt till den lokala databasen och lagringen
 *   npm run migrate -- --only=posts              Bara nyheter
 *   npm run migrate -- --only=gallery --limit=3  Bara de tre senaste albumen (bra för test)
 *   npm run migrate -- --remote                  Allt till produktionen på Cloudflare
 *
 * Vad som flyttas:
 *   - Alla nyhetsinlägg, med bilder. Länkar till gamla inlägg pekas om till /nyheter/…
 *   - Alla album i bildgalleriet (även "Gamla bilder"). Originalen sparas orörda, och
 *     visningsversioner skapas i WebP (640, 1400 och 2800 px breda).
 *   - Matrikelbladet (PDF) och styrelsens gruppbild.
 *
 * Skriptet kan avbrytas och köras igen. Klara bilder och album hoppas över
 * (statusen sparas i migration-output/). Använd --force för att göra om album.
 * En full körning laddar ner omkring 25–35 GB och tar flera timmar. Efteråt finns allt i R2,
 * så den gamla WordPress-sajten kan stängas ner.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getPlatformProxy } from "wrangler";
import sharp from "sharp";
import TurndownService from "turndown";

// Inställningar --------------------------------------------------------------------

const SITE = "https://www.ypsa.se";
const OUT = "migration-output";
// Samma storlekar som i src/lib/images.ts.
const SIZES = { thumb: 640, medium: 1400, large: 2800 };
const PARALLEL = 4;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const REMOTE = !!args.remote;
const DRY = !!args["dry-run"];
const ONLY = args.only ?? "all";
const LIMIT = args.limit ? Number(args.limit) : Infinity;
const FORCE = !!args.force;
const TARGET = REMOTE ? "remote" : "local";

fs.mkdirSync(OUT, { recursive: true });

// Hjälpfunktioner -------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url, as = "text", tries = 4) {
  let lastError;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0 (Ypsilon migrering)" },
        signal: AbortSignal.timeout(90_000),
        redirect: "follow",
      });
      if (res.status === 404) throw Object.assign(new Error(`404 ${url}`), { permanent: true });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return as === "buffer" ? Buffer.from(await res.arrayBuffer()) : as === "json" ? res.json() : res.text();
    } catch (e) {
      lastError = e;
      if (e.permanent) break;
      await sleep(1000 * 2 ** i);
    }
  }
  throw lastError;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };
function decode(text = "") {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function slugify(text) {
  return (
    text.toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o")
      .normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "sida"
  );
}

function stripTags(html) {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Kör fn för alla element med högst n samtidigt. */
async function pool(items, n, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }),
  );
  return results;
}

/** Tar bort WordPress storleksändelse, t.ex. bild-300x200.jpg → bild.jpg */
const originalOf = (url) => url.replace(/-\d+x\d+(\.[a-z]+)$/i, "$1");
const cleanUrl = (url) => decode(url).trim().split("?")[0].replace(/^http:\/\//, "https://");

// Status för omstart ---------------------------------------------------------------------

const STATE_FILE = path.join(OUT, `status-${TARGET}.json`);
const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) : { media: {}, albums: {} };
let dirty = 0;
function saveState(force = false) {
  if (DRY) return;
  if (force || ++dirty % 20 === 0) fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}

// Cloudflare-bindningar --------------------------------------------------------------------

let env;
let dispose = async () => {};
let tempConfig;

if (!DRY) {
  let configPath;
  if (REMOTE) {
    // En tillfällig kopia av wrangler.jsonc där databasen och lagringen pekar på produktionen.
    const raw = fs.readFileSync("wrangler.jsonc", "utf8").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    const config = JSON.parse(raw);
    if (config.d1_databases[0].database_id.startsWith("00000000")) {
      console.error("database_id i wrangler.jsonc är inte ifyllt. Skapa databasen först (se README).");
      process.exit(1);
    }
    config.d1_databases[0].remote = true;
    config.r2_buckets[0].remote = true;
    tempConfig = path.resolve("wrangler.migrering-produktion.json");
    fs.writeFileSync(tempConfig, JSON.stringify(config, null, 2));
    configPath = tempConfig;
  }
  const proxy = await getPlatformProxy({ configPath, persist: true });
  env = proxy.env;
  dispose = proxy.dispose;
}

async function cleanup() {
  saveState(true);
  await dispose();
  if (tempConfig && fs.existsSync(tempConfig)) fs.rmSync(tempConfig);
}
process.on("SIGINT", async () => {
  console.log("\nAvbryter. Kör skriptet igen för att fortsätta där det slutade.");
  await cleanup();
  process.exit(130);
});

// Bilder och filer ---------------------------------------------------------------------------

let bytesStored = 0;

async function put(key, buffer, contentType) {
  await env.MEDIA.put(key, buffer, {
    httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
  });
  bytesStored += buffer.length;
}

const ORIGINAL_TYPES = {
  jpeg: ["jpg", "image/jpeg"],
  png: ["png", "image/png"],
  webp: ["webp", "image/webp"],
  gif: ["gif", "image/gif"],
  heif: ["heic", "image/heic"],
  tiff: ["tif", "image/tiff"],
};

/**
 * Laddar ner en bild och sparar originalet orört i R2, plus visningsversioner i WebP:
 * 640, 1400 och 2800 px breda (aldrig större än originalet).
 * Med { thumb: false } skapas bara 1400-versionen, för bilder i nyhetsinlägg.
 * Returnerar adresserna, eller null om bilden inte gick att hämta.
 */
async function migrateImage(sourceUrls, keyBase, { thumb = true } = {}) {
  const urls = [...new Set(sourceUrls.filter(Boolean))];
  // Versionsmärkt nyckel: bilder som migrerades innan originalen sparades görs om.
  const cacheKey = `v2:${urls[0]}`;
  if (state.media[cacheKey]) return state.media[cacheKey];

  let buffer;
  for (const url of urls) {
    try {
      buffer = await fetchRetry(url, "buffer");
      break;
    } catch {
      /* prova nästa adress */
    }
  }
  if (!buffer) return null;

  try {
    const image = sharp(buffer, { failOn: "none", limitInputPixels: false }).rotate();
    const meta = await image.metadata();
    const [origExt, origType] = ORIGINAL_TYPES[meta.format] ?? ["bin", "application/octet-stream"];

    // Originalet, precis som det låg på den gamla servern.
    await put(`${keyBase}-original.${origExt}`, buffer, origType);
    const original = `/media/${keyBase}-original.${origExt}`;

    const webp = async (width, quality, suffix) => {
      const out = await image
        .clone()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer({ resolveWithObject: true });
      const key = `${keyBase}${suffix}.webp`;
      await put(key, out.data, "image/webp");
      return { url: `/media/${key}`, width: out.info.width, height: out.info.height };
    };

    let result;
    if (thumb) {
      const large = await webp(SIZES.large, 82, "");
      const medium = await webp(SIZES.medium, 80, "-1400");
      const small = await webp(SIZES.thumb, 76, "-640");
      result = { src: large.url, medium: medium.url, thumb: small.url, original, width: large.width, height: large.height };
    } else {
      const medium = await webp(SIZES.medium, 82, "");
      result = { src: medium.url, medium: medium.url, thumb: medium.url, original, width: medium.width, height: medium.height };
    }
    state.media[cacheKey] = result;
    saveState();
    return result;
  } catch (e) {
    console.warn(`  Kunde inte bearbeta ${urls[0]}: ${e.message}`);
    return null;
  }
}

async function migrateFile(url, key) {
  if (state.media[url]) return state.media[url];
  const buffer = await fetchRetry(url, "buffer");
  const type = url.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream";
  await put(key, buffer, type);
  state.media[url] = { src: `/media/${key}` };
  saveState();
  return state.media[url];
}

const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 8);

// Nyheter -------------------------------------------------------------------------------------

function makeTurndown() {
  const td = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", emDelimiter: "*", strongDelimiter: "**" });
  // Gamla inlägg har rubriker på alla nivåer; på nya sajten används bara mellanrubriker.
  td.addRule("rubriker", {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    replacement: (content, node) => {
      const text = content.trim();
      if (!text) return "\n\n";
      return `\n\n${["H1", "H2"].includes(node.nodeName) ? "##" : "###"} ${text}\n\n`;
    },
  });
  td.addRule("bildtext", {
    filter: "figcaption",
    replacement: (content) => (content.trim() ? `\n\n*${content.trim()}*\n\n` : ""),
  });
  td.addRule("tomma", { filter: ["script", "style", "iframe", "noscript"], replacement: () => "" });
  return td;
}

function rewriteLinks(html, postSlugs) {
  return html.replace(/href="([^"]+)"/g, (m, href) => {
    const url = decode(href);
    const post = url.match(/^https?:\/\/(?:www\.)?ypsa\.se\/(?:wordpress\/)?\d{4}\/\d{2}\/([^/?#]+)/);
    if (post) return `href="/nyheter/${slugify(decodeURIComponent(post[1]))}"`;
    const internal = url.match(/^(?:https?:\/\/(?:www\.)?ypsa\.se)?(\/[^"]*)$/);
    if ((internal || /^https?:\/\/(?:www\.)?ypsa\.se\/?$/.test(url)) && !/wp-content/.test(url)) {
      const p = internal?.[1] ?? "/";
      // Gamla inlägg kunde också ligga direkt under roten, t.ex. /alggasquen/.
      const last = p.replace(/\/+$/, "").split("/").pop() ?? "";
      if (last && postSlugs.has(slugify(decodeURIComponent(last))) && p.split("/").filter(Boolean).length === 1) {
        return `href="/nyheter/${slugify(decodeURIComponent(last))}"`;
      }
      return `href="${p}"`;
    }
    return m;
  });
}

async function migratePosts() {
  console.log("\nNyheter");
  const posts = [];
  for (let page = 1; ; page++) {
    const batch = await fetchRetry(`${SITE}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=wp:featuredmedia`, "json").catch(() => []);
    posts.push(...batch);
    if (batch.length < 100) break;
  }
  console.log(`  ${posts.length} inlägg hittades`);
  const td = makeTurndown();
  const postSlugs = new Set(posts.map((p) => slugify(decodeURIComponent(p.slug))));
  if (DRY) fs.mkdirSync(path.join(OUT, "forhandsgranskning"), { recursive: true });

  let done = 0;
  let imageCount = 0;
  let failedImages = 0;

  await pool(posts, 2, async (p) => {
    const year = p.date.slice(0, 4);
    let html = p.content.rendered;

    // En miniatyr som länkar till originalbilden ersätts med originalet.
    html = html.replace(
      /<a[^>]+href="([^"]+\.(?:jpe?g|png|gif))(?:\?[^"]*)?"[^>]*>\s*(<img[^>]*>)\s*<\/a>/gi,
      (_, href, img) => img.replace("<img", `<img data-original="${href}"`),
    );

    // Bilder: hämta, skala ner och peka om till nya lagringen.
    const imgs = [...html.matchAll(/<img[^>]*>/gi)].map((m) => m[0]);
    for (const tag of imgs) {
      const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
      const original = tag.match(/data-original="([^"]+)"/)?.[1];
      const alt = decode(tag.match(/\salt="([^"]*)"/)?.[1] ?? "");
      if (!src) continue;
      let replacement = "";
      if (DRY) {
        replacement = `<img src="${cleanUrl(original ?? src)}" alt="${alt}">`;
      } else {
        const candidates = [original && cleanUrl(original), originalOf(cleanUrl(src)), cleanUrl(src)];
        const base = path.basename(cleanUrl(original ?? src)).replace(/\.[^.]+$/, "");
        const res = await migrateImage(candidates, `nyheter/wp/${year}/${hash(cleanUrl(src))}-${slugify(base)}`, { thumb: false });
        imageCount++;
        if (res) replacement = `<img src="${res.src}" alt="${alt}">`;
        else failedImages++;
      }
      html = html.replace(tag, replacement);
    }

    // Länkade filer (t.ex. PDF:er) på gamla sajten flyttas också.
    if (!DRY) {
      for (const m of [...html.matchAll(/href="(https?:\/\/(?:www(?:-static)?\.)?ypsa\.se\/wp-content\/uploads\/[^"]+\.(?:pdf|docx?))"/gi)]) {
        try {
          const file = await migrateFile(cleanUrl(m[1]), `filer/wp/${hash(m[1])}-${path.basename(cleanUrl(m[1]))}`);
          html = html.replace(m[1], file.src);
        } catch {
          /* behåll gamla länken */
        }
      }
    }

    html = rewriteLinks(html, postSlugs);
    let body = td
      .turndown(html)
      .replace(/ /g, " ")
      // Två radbrytningar i rad var ett nytt stycke i WordPress.
      .replace(/ {2}\n(?:[ \t]*\n| {2}\n)+/g, "\n\n")
      .replace(/^[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    // Länkar till bildfiler på den gamla servern försvinner när WordPress stängs:
    // tomma länkar tas bort och länkar med text blir vanlig text.
    body = body
      .replace(/\[\s*\]\((?:https?:)?\/\/(?:www(?:-static)?\.)?ypsa\.se\/wp-content\/[^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\((?:https?:)?\/\/(?:www(?:-static)?\.)?ypsa\.se\/wp-content\/[^)]*\.(?:jpe?g|png|gif|webp)[^)]*\)/gi, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (!body) body = "*(Inlägget saknar text.)*";

    const title = decode(p.title.rendered).trim() || "Utan rubrik";
    const excerptText = stripTags(p.excerpt?.rendered ?? "").replace(/\s*(\[…\]|\[&hellip;\]|Read more|Läs mer)\s*$/i, "");
    const excerpt = excerptText ? (excerptText.length > 220 ? excerptText.slice(0, excerptText.lastIndexOf(" ", 220)) + "…" : excerptText) : null;
    const slug = slugify(decodeURIComponent(p.slug)) || `inlagg-${p.id}`;

    let cover = null;
    const featured = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    if (featured && !DRY) {
      const res = await migrateImage([cleanUrl(featured)], `nyheter/wp/${year}/omslag-${p.id}`, { thumb: false });
      cover = res?.src ?? null;
    }

    if (DRY) {
      fs.writeFileSync(path.join(OUT, "forhandsgranskning", `${p.date.slice(0, 10)}-${slug}.md`), `# ${title}\n\n${body}\n`);
    } else {
      const source = `wp:post:${p.id}`;
      // Om adressen redan används av ett annat inlägg får det migrerade inlägget en egen.
      const taken = await env.DB.prepare("SELECT id FROM posts WHERE slug = ? AND (source IS NULL OR source != ?)").bind(slug, source).first();
      const finalSlug = taken ? `${slug}-${p.id}` : slug;
      await env.DB.prepare(
        `INSERT INTO posts (slug, title, excerpt, body, cover, published, published_at, source)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)
         ON CONFLICT(source) WHERE source IS NOT NULL DO UPDATE SET
           slug = excluded.slug, title = excluded.title, excerpt = excluded.excerpt, body = excluded.body,
           cover = excluded.cover, published_at = excluded.published_at, updated_at = datetime('now')`,
      ).bind(finalSlug, title, excerpt, body, cover, p.date.slice(0, 10), source).run();
    }
    done++;
    if (done % 10 === 0 || done === posts.length) process.stdout.write(`  ${done}/${posts.length} inlägg klara\r`);
  });

  console.log(`\n  ${imageCount} bilder i inläggen${failedImages ? `, ${failedImages} gick inte att hämta och togs bort` : ""}`);
  if (failedImages) {
    console.log("  (Bilder som saknas finns inte längre på den gamla servern och visas inte heller på den gamla sajten.)");
  }
  if (DRY) console.log(`  Förhandsgranskning sparad i ${OUT}/forhandsgranskning/`);
}

// Galleri ------------------------------------------------------------------------------------

async function listAlbums() {
  const albums = [];
  for (const listUrl of [`${SITE}/foton`, `${SITE}/foton/gamla-bilder`]) {
    const html = await fetchRetry(listUrl);
    const blocks = html.split('<div class="ngg-album">').slice(1);
    for (const b of blocks) {
      const link = b.match(/class="ngg-albumtitle"><a href="\s*([^"\s]+)\s*">([^<]*)<\/a>/);
      if (!link) continue;
      const count = Number(b.match(/<strong>(\d+)<\/strong>/)?.[1] ?? 0);
      const t = Number(b.match(/[?&]t=(\d{9,})/)?.[1] ?? 0);
      const title = decode(link[2]).replace(/\s+/g, " ").trim();
      const titleYear = title.match(/\b(19[6-9]\d|20\d\d)\b/)?.[1];
      const year = titleYear ? Number(titleYear) : t ? new Date(t * 1000).getUTCFullYear() : null;
      const description = stripTags(b.match(/class="ngg-description">\s*<p>([\s\S]*?)<\/p>/)?.[1] ?? "") || null;
      albums.push({ url: decode(link[1]), title, count, year, description, source: `wp:album:${decode(link[1]).replace(/\/+$/, "").split("/").pop()}` });
    }
  }
  return albums;
}

async function albumImages(url) {
  const images = [];
  const seen = new Set();
  for (let page = 1; page < 50; page++) {
    const html = await fetchRetry(page === 1 ? url : `${url.replace(/\/+$/, "")}/page/${page}`).catch(() => "");
    const found = [...html.matchAll(/<a[^>]*data-src="([^"]+)"[^>]*>/g)].map((m) => {
      const tag = m[0];
      const desc = decode(tag.match(/data-description="([^"]*)"/)?.[1] ?? "").trim();
      return { src: cleanUrl(m[1]), caption: desc || null };
    });
    const fresh = found.filter((f) => !seen.has(f.src));
    fresh.forEach((f) => seen.add(f.src));
    images.push(...fresh);
    if (fresh.length === 0 || !html.includes(`/page/${page + 1}`)) break;
  }
  return images;
}

async function migrateGallery() {
  console.log("\nGalleri");
  let albums = await listAlbums();
  const totalImages = albums.reduce((n, a) => n + a.count, 0);
  console.log(`  ${albums.length} album med ungefär ${totalImages} bilder hittades`);
  albums = albums.slice(0, LIMIT);
  // Äldst först, så att albumen får stigande id och sorteras rätt inom samma år.
  albums.reverse();

  let n = 0;
  for (const album of albums) {
    n++;
    if (state.albums[album.source] && !FORCE) {
      console.log(`  [${n}/${albums.length}] ${album.title}: redan klart`);
      continue;
    }
    const images = await albumImages(album.url);
    console.log(`  [${n}/${albums.length}] ${album.title} (${album.year ?? "okänt år"}): ${images.length} bilder`);
    if (DRY || images.length === 0) continue;

    const base = slugify(album.title);
    let done = 0;
    const results = await pool(images, PARALLEL, async (img, i) => {
      const name = slugify(path.basename(img.src).replace(/\.[^.]+$/, "")).slice(0, 40);
      const res = await migrateImage([img.src], `galleri/wp/${base}-${hash(album.source)}/${String(i + 1).padStart(4, "0")}-${name}`);
      done++;
      process.stdout.write(`      ${done}/${images.length}\r`);
      return res ? { ...res, caption: img.caption } : null;
    });
    const ok = results.filter(Boolean);
    const failed = images.length - ok.length;

    const taken = await env.DB.prepare("SELECT id FROM albums WHERE slug = ? AND (source IS NULL OR source != ?)").bind(base, album.source).first();
    const slug = taken ? `${base}-${hash(album.source)}` : base;
    await env.DB.prepare(
      `INSERT INTO albums (slug, title, description, year, published, source) VALUES (?, ?, ?, ?, 1, ?)
       ON CONFLICT(source) WHERE source IS NOT NULL DO UPDATE SET
         slug = excluded.slug, title = excluded.title, description = excluded.description, year = excluded.year`,
    ).bind(slug, album.title, album.description, album.year, album.source).run();
    const { id } = await env.DB.prepare("SELECT id FROM albums WHERE source = ?").bind(album.source).first();

    await env.DB.prepare("DELETE FROM album_images WHERE album_id = ?").bind(id).run();
    for (let i = 0; i < ok.length; i += 50) {
      await env.DB.batch(
        ok.slice(i, i + 50).map((r, j) =>
          env.DB.prepare(
            "INSERT INTO album_images (album_id, src, medium, thumb, original, width, height, caption, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ).bind(id, r.src, r.medium ?? null, r.thumb, r.original ?? null, r.width ?? null, r.height ?? null, r.caption, i + j + 1),
        ),
      );
    }
    console.log(`      ${ok.length} bilder sparade${failed ? `, ${failed} gick inte att hämta` : ""}          `);
    state.albums[album.source] = true;
    saveState(true);
  }
}

// Övrigt: matrikelblad och styrelsebild -------------------------------------------------------------

async function migrateExtras() {
  console.log("\nÖvrigt");
  if (DRY) return console.log("  Hoppas över i förhandsgranskning");
  const get = async (key) => (await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first())?.value ?? "";
  const set = (key, value) =>
    env.DB.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(key, value).run();

  // Matrikelbladet byts bara om det fortfarande pekar på gamla sajten.
  const matrikel = await get("matrikel_url");
  if (!matrikel || matrikel.includes("ypsa.se/wp-content")) {
    try {
      const file = await migrateFile(
        "https://www-static.ypsa.se/wp-content/uploads/2012/05/MatrikelbladYpsilonv%C3%A5ren2012-v2.pdf",
        "filer/wp/matrikelblad-ypsilon.pdf",
      );
      await set("matrikel_url", file.src);
      console.log("  Matrikelbladet flyttat");
    } catch (e) {
      console.warn(`  Matrikelbladet kunde inte flyttas: ${e.message}`);
    }
  }

  // Styrelsens gruppbild sätts bara om ingen bild redan är vald.
  if (!(await get("board_photo"))) {
    const res = await migrateImage(
      [
        "https://www.ypsa.se/wp-content/uploads/2023/11/YpsilonAG2023-kopiera.jpg",
        "https://www.ypsa.se/wp-content/uploads/2023/11/YpsilonAG2023-scaled.jpg",
      ],
      "bilder/wp/styrelsen-alggasquen-2023",
    );
    if (res) {
      await set("board_photo", res.src);
      await set("board_photo_caption", "Ypsilons styrelse på Älggasquen 2023");
      console.log("  Styrelsens gruppbild flyttad");
    }
  }
}

// Kör -----------------------------------------------------------------------------------------

const started = Date.now();
console.log(`Migrering från ${SITE} till ${DRY ? "förhandsgranskning (inget sparas)" : REMOTE ? "PRODUKTION" : "lokal databas"}`);
try {
  if (ONLY === "all" || ONLY === "posts") await migratePosts();
  if (ONLY === "all" || ONLY === "gallery") await migrateGallery();
  if (ONLY === "all" || ONLY === "extras") await migrateExtras();
  const minutes = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`\nKlart på ${minutes} min. ${(bytesStored / 1024 / 1024).toFixed(1)} MB sparades i lagringen under den här körningen.`);
} catch (e) {
  console.error("\nMigreringen avbröts:", e);
  process.exitCode = 1;
} finally {
  await cleanup();
}
