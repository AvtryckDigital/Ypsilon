import "server-only";
import { ENTITIES } from "./admin/entities";
import { getPageFields, PAGES, SETTINGS_GROUPS } from "./admin/site";
import { all, batch, run } from "./db";
import { getEnv } from "./cf";
import { deleteMedia, mediaUrl } from "./media";

export type LibraryImage = {
  id: number;
  src: string;
  medium: string | null;
  thumb: string | null;
  name: string | null;
  width: number | null;
  height: number | null;
  size: number | null;
  created_at: string;
};

/**
 * Samlar alla bildadresser som sajten pekar på: inställningar, sidor, innehåll och album.
 * Bilder inne i texter hittas genom att leta efter adressen i texten.
 * Antalet databasfrågor är detsamma oavsett hur många bilder som kontrolleras.
 */
export async function collectUsage() {
  const refs = new Map<string, string[]>();
  const texts: { where: string; text: string }[] = [];
  const add = (url: string | null | undefined, where: string) => {
    if (!url) return;
    const list = refs.get(url) ?? [];
    if (!list.includes(where)) list.push(where);
    refs.set(url, list);
  };

  const allLabels = new Map([
    ...SETTINGS_GROUPS.flatMap((g) => g.fields).map((f) => [f.name, f.label] as const),
    ...PAGES.flatMap((p) => getPageFields(p)).map((f) => [f.name, f.label] as const),
  ]);
  for (const s of await all<{ key: string; value: string | null }>("SELECT key, value FROM settings")) {
    if (s.value?.startsWith("/media/")) add(s.value, `Inställningar/Sidor: ${allLabels.get(s.key) ?? s.key}`);
  }

  for (const p of await all<{ slug: string; image: string | null; body: string | null }>("SELECT slug, image, body FROM pages")) {
    const where = `Sidor: ${PAGES.find((x) => x.slug === p.slug)?.label ?? p.slug}`;
    add(p.image, where);
    if (p.body) texts.push({ where, text: p.body });
  }

  for (const e of ENTITIES) {
    const media = e.fields.filter((f) => f.type === "image" || f.type === "file").map((f) => f.name);
    const markdown = e.fields.filter((f) => f.type === "markdown").map((f) => f.name);
    if (media.length + markdown.length === 0) continue;
    const cols = [...new Set([e.titleColumn, ...media, ...markdown])];
    for (const row of await all<Record<string, string | null>>(`SELECT ${cols.join(", ")} FROM ${e.table}`)) {
      const where = `${e.label}: ${row[e.titleColumn] ?? "utan rubrik"}`;
      for (const f of media) add(row[f], where);
      for (const f of markdown) {
        const text = row[f];
        if (text) texts.push({ where, text });
      }
    }
  }

  const albumImages = await all<{ title: string; src: string; thumb: string; medium: string | null; original: string | null }>(
    "SELECT a.title, i.src, i.thumb, i.medium, i.original FROM album_images i JOIN albums a ON a.id = i.album_id",
  );
  for (const i of albumImages) for (const u of [i.src, i.thumb, i.medium, i.original]) add(u, `Galleri: ${i.title}`);

  /** Alla platser där någon av adresserna används, t.ex. "Inställningar: Stor bild överst". */
  return function usage(...urls: (string | null | undefined)[]) {
    const found: string[] = [];
    for (const url of urls) {
      if (!url) continue;
      for (const w of refs.get(url) ?? []) if (!found.includes(w)) found.push(w);
      for (const t of texts) if (t.text.includes(url) && !found.includes(t.where)) found.push(t.where);
    }
    return found;
  };
}

/** Adresser som hör till bilder i biblioteket, i alla storlekar. */
async function libraryUrls() {
  const rows = await all<{ src: string; medium: string | null; thumb: string | null }>("SELECT src, medium, thumb FROM media");
  return new Set(rows.flatMap((r) => [r.src, r.medium, r.thumb]).filter((u): u is string => !!u));
}

/**
 * Raderar filer som inte längre behövs. Bilder i biblioteket och filer som fortfarande
 * används någonstans på sajten lämnas kvar.
 */
export async function deleteIfUnused(urls: (string | null | undefined)[]) {
  const candidates = [...new Set(urls.filter((u): u is string => !!u && u.startsWith("/media/")))];
  if (candidates.length === 0) return;
  const [library, usage] = await Promise.all([libraryUrls(), collectUsage()]);
  const unused = candidates.filter((u) => !library.has(u) && usage(u).length === 0);
  // R2 tar emot högst 1000 nycklar per anrop.
  for (let i = 0; i < unused.length; i += 900) await deleteMedia(...unused.slice(i, i + 900)).catch(() => {});
}

/** Lägger till en uppladdad bild i biblioteket. */
export async function registerImage(img: Omit<LibraryImage, "id" | "created_at">) {
  await run(
    "INSERT INTO media (src, medium, thumb, name, width, height, size) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(src) DO NOTHING",
    img.src, img.medium, img.thumb, img.name, img.width, img.height, img.size,
  );
}

const VARIANT = /-(1400|640|original)\.[a-z0-9]+$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

/**
 * Går igenom mappen bilder/ i lagringen och lägger till bilder som saknas i biblioteket.
 * Behövs för bilder som laddades upp innan biblioteket fanns. Returnerar antalet nya bilder.
 */
export async function scanStorage() {
  const { MEDIA } = await getEnv();
  const objects: { key: string; size: number; uploaded: Date }[] = [];
  let cursor: string | undefined;
  do {
    const page = await MEDIA.list({ prefix: "bilder/", cursor, limit: 1000 });
    objects.push(...page.objects.map((o) => ({ key: o.key, size: o.size, uploaded: o.uploaded })));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  const keys = new Set(objects.map((o) => o.key));
  const existing = await libraryUrls();
  const baseOf = (key: string) => key.slice(0, key.lastIndexOf("."));

  // Samma bild kan finnas i flera format, t.ex. från flytten av den gamla sajten. Ta bara en, helst WebP.
  const rank = (key: string) => (key.endsWith(".webp") ? 0 : /\.jpe?g$/i.test(key) ? 1 : 2);
  const best = new Map<string, (typeof objects)[number]>();
  for (const o of objects) {
    if (!IMAGE_EXT.test(o.key) || VARIANT.test(o.key)) continue;
    const prev = best.get(baseOf(o.key));
    if (!prev || rank(o.key) < rank(prev.key)) best.set(baseOf(o.key), o);
  }
  const libraryBases = new Set([...existing].map((u) => baseOf(u)));

  const rows = [...best.values()]
    .filter((o) => !libraryBases.has(baseOf(mediaUrl(o.key))))
    .map((o) => {
      const ext = o.key.slice(o.key.lastIndexOf("."));
      const base = o.key.slice(0, -ext.length);
      // Mindre versioner har samma namn med -1400 eller -640 på slutet.
      const variant = (suffix: string) => [ext, ".webp", ".jpg"].map((x) => `${base}-${suffix}${x}`).find((k) => keys.has(k));
      const medium = variant("1400");
      const thumb = variant("640");
      const name = base.slice(base.lastIndexOf("/") + 1).replace(/^[0-9a-f]{8}-/, "");
      return {
        sql: "INSERT INTO media (src, medium, thumb, name, size, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(src) DO NOTHING",
        params: [
          mediaUrl(o.key),
          medium ? mediaUrl(medium) : null,
          thumb ? mediaUrl(thumb) : null,
          name,
          o.size,
          o.uploaded.toISOString().replace("T", " ").slice(0, 19),
        ],
      };
    });
  for (let i = 0; i < rows.length; i += 50) await batch(rows.slice(i, i + 50));
  return rows.length;
}

/**
 * Raderar en bild ur biblioteket och lagringen. Om bilden används någonstans raderas
 * den inte, och platserna returneras i stället.
 */
export async function deleteLibraryImage(img: LibraryImage) {
  const usage = await collectUsage();
  const used = usage(img.src, img.medium, img.thumb);
  if (used.length) return used;
  await run("DELETE FROM media WHERE id = ?", img.id);
  await deleteMedia(img.src, img.medium, img.thumb).catch(() => {});
  if (img.size) {
    await run(
      "UPDATE settings SET value = CAST(MAX(0, CAST(COALESCE(value, '0') AS INTEGER) - ?) AS TEXT) WHERE key = 'r2_storage_bytes'",
      img.size
    );
  }
  return [];
}
