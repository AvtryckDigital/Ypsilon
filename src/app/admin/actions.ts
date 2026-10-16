"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endOtherSessions, logout, requireUser } from "@/lib/auth";
import { all, batch, first, run } from "@/lib/db";
import { getEntity, slugify, type Entity } from "@/lib/admin/entities";
import type { Field } from "@/lib/admin/fields";
import { errorState, parseFields, type FormState } from "@/lib/admin/parse";
import { getPageFields, PAGES, SETTINGS_GROUPS } from "@/lib/admin/site";
import { deleteIfUnused, deleteLibraryImage, scanStorage, type LibraryImage } from "@/lib/media-library";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "@/lib/password";

type Row = Record<string, string | number | null>;

const mediaFields = (fields: Field[]) => fields.filter((f) => f.type === "image" || f.type === "file").map((f) => f.name);

function revalidate(entity: Entity, row?: Row | null) {
  for (const p of entity.revalidate) revalidatePath(p);
  if (row && entity.publicPath) revalidatePath(entity.publicPath(row));
  revalidatePath("/admin", "layout");
}

/** Raderar ersatta filer, men aldrig bilder i biblioteket eller filer som används någon annanstans. */
async function deleteUnusedMedia(urls: string[]) {
  await deleteIfUnused(urls);
}

/** Ger en unik slug i tabellen genom att lägga till -2, -3 … vid behov. */
async function uniqueSlug(table: string, base: string, id: number | null) {
  let slug = base;
  for (let i = 2; i < 500; i++) {
    const hit = await first<{ id: number }>(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`, slug, id ?? -1);
    if (!hit) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

// Innehåll (nyheter, kalendarium, sångbok …) ------------------------------------

export async function saveEntity(key: string, id: number | null, _prev: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  const entity = getEntity(key);
  if (!entity) return { error: "Okänd innehållstyp." };

  const { values, errors } = parseFields(entity.fields, form);
  Object.assign(errors, entity.validate?.(values) ?? {});
  if (Object.keys(errors).length) return errorState(errors);

  let data: Row = entity.derive ? entity.derive(values) : values;

  if (entity.slugFrom) {
    const base = slugify(String(data.slug || data[entity.slugFrom] || ""));
    data = { ...data, slug: await uniqueSlug(entity.table, base, id) };
  }

  const existing = id ? await first<Row>(`SELECT * FROM ${entity.table} WHERE id = ?`, id) : null;
  if (id && !existing) return { error: "Raden finns inte längre. Den kan ha tagits bort av någon annan." };

  const columns = Object.keys(data);
  let newId = id;
  if (id) {
    const sets = columns.map((c) => `${c} = ?`);
    if (entity.table === "posts") sets.push("updated_at = datetime('now')");
    await run(`UPDATE ${entity.table} SET ${sets.join(", ")} WHERE id = ?`, ...columns.map((c) => data[c]), id);

    // Ta bort ersatta bilder från lagringen.
    const replaced = mediaFields(entity.fields).filter((f) => existing![f] && existing![f] !== data[f]).map((f) => existing![f] as string);
    if (replaced.length) await deleteUnusedMedia(replaced);
  } else {
    if (entity.sortable) {
      const max = await first<{ m: number | null }>(`SELECT MAX(sort_order) AS m FROM ${entity.table}`);
      data.sort_order = (max?.m ?? 0) + 1;
      columns.push("sort_order");
    }
    const res = await run(
      `INSERT INTO ${entity.table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
      ...columns.map((c) => data[c]),
    );
    newId = res.lastId;
  }

  revalidate(entity, { ...data, id: newId });
  // Ett nytt album öppnas direkt så att man kan ladda upp bilder.
  if (!id && entity.key === "galleri") redirect(`/admin/galleri/${newId}?sparat=1`);
  redirect(`/admin/${entity.key}?sparat=1`);
}

export async function deleteEntity(key: string, id: number) {
  await requireUser();
  const entity = getEntity(key);
  if (!entity) return;
  const row = await first<Row>(`SELECT * FROM ${entity.table} WHERE id = ?`, id);
  if (!row) redirect(`/admin/${key}`);

  const media = mediaFields(entity.fields).map((f) => row[f] as string | null);
  if (entity.table === "albums") {
    const images = await all<{ src: string; thumb: string; medium: string | null; original: string | null }>(
      "SELECT src, thumb, medium, original FROM album_images WHERE album_id = ?", id,
    );
    media.push(...images.flatMap((i) => [i.src, i.thumb, i.medium, i.original]));
  }
  await run(`DELETE FROM ${entity.table} WHERE id = ?`, id);
  await deleteIfUnused(media);

  revalidate(entity, row);
  redirect(`/admin/${key}?borttagen=1`);
}

export async function moveEntity(key: string, id: number, direction: "up" | "down") {
  await requireUser();
  const entity = getEntity(key);
  if (!entity?.sortable) return;
  const rows = await all<{ id: number }>(`SELECT id FROM ${entity.table} ORDER BY sort_order, id`);
  const i = rows.findIndex((r) => r.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  await batch(rows.map((r, n) => ({ sql: `UPDATE ${entity.table} SET sort_order = ? WHERE id = ?`, params: [n + 1, r.id] })));
  revalidate(entity);
}

// Album och bilder ---------------------------------------------------------------

export async function addAlbumImages(
  albumId: number,
  images: { src: string; medium: string | null; thumb: string; original: string | null; width: number | null; height: number | null }[],
) {
  await requireUser();
  const isMedia = (u: string | null) => u === null || u.startsWith("/media/");
  const valid = images.filter((i) => i.src.startsWith("/media/") && i.thumb.startsWith("/media/") && isMedia(i.medium) && isMedia(i.original));
  const max = await first<{ m: number | null }>("SELECT MAX(sort_order) AS m FROM album_images WHERE album_id = ?", albumId);
  let order = max?.m ?? 0;
  await batch(
    valid.map((i) => ({
      sql: "INSERT INTO album_images (album_id, src, medium, thumb, original, width, height, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      params: [albumId, i.src, i.medium, i.thumb, i.original, i.width, i.height, ++order],
    })),
  );
  revalidatePath("/galleri", "layout");
  revalidatePath(`/admin/galleri/${albumId}`);
}

export async function updateImageCaption(imageId: number, caption: string) {
  await requireUser();
  await run("UPDATE album_images SET caption = ? WHERE id = ?", caption.trim() || null, imageId);
  revalidatePath("/galleri", "layout");
}

export async function deleteAlbumImage(imageId: number) {
  await requireUser();
  const img = await first<{ album_id: number; src: string; thumb: string; medium: string | null; original: string | null }>(
    "SELECT album_id, src, thumb, medium, original FROM album_images WHERE id = ?", imageId,
  );
  if (!img) return;
  await run("DELETE FROM album_images WHERE id = ?", imageId);
  await run("UPDATE albums SET cover = NULL WHERE id = ? AND cover IN (?, ?)", img.album_id, img.src, img.thumb);
  // Bilden kan vara vald på andra ställen, t.ex. som stor bild på startsidan. Då får filerna ligga kvar.
  await deleteIfUnused([img.src, img.thumb, img.medium, img.original]);
  revalidatePath("/galleri", "layout");
  revalidatePath(`/admin/galleri/${img.album_id}`);
}

export async function setAlbumCover(albumId: number, thumb: string) {
  await requireUser();
  // Omslaget pekar på en bild som redan hör till albumet, så den ska inte raderas om omslaget byts.
  await run("UPDATE albums SET cover = ? WHERE id = ?", thumb, albumId);
  revalidatePath("/galleri", "layout");
  revalidatePath(`/admin/galleri/${albumId}`);
}

export async function moveAlbumImage(imageId: number, direction: "up" | "down") {
  await requireUser();
  const img = await first<{ album_id: number }>("SELECT album_id FROM album_images WHERE id = ?", imageId);
  if (!img) return;
  const rows = await all<{ id: number }>("SELECT id FROM album_images WHERE album_id = ? ORDER BY sort_order, id", img.album_id);
  const i = rows.findIndex((r) => r.id === imageId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  await batch(rows.map((r, n) => ({ sql: "UPDATE album_images SET sort_order = ? WHERE id = ?", params: [n + 1, r.id] })));
  revalidatePath("/galleri", "layout");
  revalidatePath(`/admin/galleri/${img.album_id}`);
}

// Mediebiblioteket ---------------------------------------------------------------

/** Lägger till bilder som laddades upp innan biblioteket fanns. */
export async function scanMediaLibrary(): Promise<{ added: number }> {
  await requireUser();
  const added = await scanStorage();
  revalidatePath("/admin/bilder");
  return { added };
}

export async function renameLibraryImage(id: number, name: string) {
  await requireUser();
  await run("UPDATE media SET name = ? WHERE id = ?", name.trim() || null, id);
  revalidatePath("/admin/bilder");
}

/** Raderar en bild ur biblioteket. Returnerar var bilden används om den inte kunde raderas. */
export async function removeLibraryImage(id: number): Promise<{ usedIn: string[] }> {
  await requireUser();
  const img = await first<LibraryImage>("SELECT * FROM media WHERE id = ?", id);
  if (!img) return { usedIn: [] };
  const usedIn = await deleteLibraryImage(img);
  revalidatePath("/admin/bilder");
  return { usedIn };
}

// Sidor och inställningar ------------------------------------------------------------

export async function savePage(slug: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  const page = PAGES.find((p) => p.slug === slug);
  if (!page) return { error: "Okänd sida." };
  const fields = getPageFields(page);
  const { values, errors } = parseFields(fields, form);
  if (Object.keys(errors).length) return errorState(errors);

  const PAGE_COLUMNS = new Set(["title", "intro", "body", "image"]);
  const settingFields = fields.filter((f) => !PAGE_COLUMNS.has(f.name));

  if (settingFields.length > 0) {
    const oldSettings = Object.fromEntries(
      (await all<{ key: string; value: string | null }>("SELECT key, value FROM settings")).map((r) => [r.key, r.value]),
    );

    // En bildtext hör till en viss bild. Byts bilden utan att texten ändras töms den, och albumets namn visas i stället.
    if (
      values.hero_image !== undefined &&
      (oldSettings.hero_image ?? "") !== (values.hero_image ?? "") &&
      (oldSettings.hero_caption ?? "") === (values.hero_caption ?? "")
    ) {
      values.hero_caption = null;
    }

    await batch(
      settingFields.map((f) => ({
        sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params: [f.name, values[f.name] === null || values[f.name] === undefined ? "" : String(values[f.name])],
      })),
    );

    const replacedSettingsMedia = mediaFields(settingFields)
      .filter((f) => oldSettings[f] && oldSettings[f] !== values[f])
      .map((f) => oldSettings[f] as string);
    if (replacedSettingsMedia.length) await deleteUnusedMedia(replacedSettingsMedia);
  }

  const old = await first<{ image: string | null }>("SELECT image FROM pages WHERE slug = ?", slug);
  await run(
    `INSERT INTO pages (slug, title, intro, body, image, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET title = excluded.title, intro = excluded.intro, body = excluded.body,
       image = excluded.image, updated_at = excluded.updated_at`,
    slug,
    values.title ?? page.label,
    values.intro ?? null,
    values.body ?? null,
    values.image ?? null,
  );
  if (old?.image && old.image !== values.image) await deleteUnusedMedia([old.image]);

  revalidatePath(page.path);
  revalidatePath("/");
  revalidatePath("/admin/sidor");
  revalidatePath(`/admin/sidor/${slug}`);
  redirect("/admin/sidor?sparat=1");
}

export async function saveSettings(_prev: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  const fields = SETTINGS_GROUPS.flatMap((g) => g.fields);
  const { values, errors } = parseFields(fields, form);
  if (Object.keys(errors).length) return errorState(errors);

  const old = Object.fromEntries(
    (await all<{ key: string; value: string | null }>("SELECT key, value FROM settings")).map((r) => [r.key, r.value]),
  );

  await batch(
    fields.map((f) => ({
      sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      params: [f.name, values[f.name] === null || values[f.name] === undefined ? "" : String(values[f.name])],
    })),
  );
  const replaced = mediaFields(fields).filter((f) => old[f] && old[f] !== values[f]).map((f) => old[f] as string);
  if (replaced.length) await deleteUnusedMedia(replaced);

  revalidatePath("/", "layout");
  redirect("/admin/installningar?sparat=1");
}

// Användare ---------------------------------------------------------------------

export async function createUser(_prev: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim() || null;
  const password = String(form.get("password") ?? "");
  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Ange en giltig e-postadress.";
  if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Lösenordet måste ha minst ${MIN_PASSWORD_LENGTH} tecken.`;
  if (!errors.email && (await first("SELECT id FROM users WHERE email = ?", email))) errors.email = "Det finns redan ett konto med den adressen.";
  if (Object.keys(errors).length) return errorState(errors);

  await run("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)", email, name, await hashPassword(password));
  revalidatePath("/admin/anvandare");
  redirect("/admin/anvandare?sparat=1");
}

export async function deleteUser(id: number) {
  const me = await requireUser();
  if (me.id === id) return;
  const count = await first<{ n: number }>("SELECT COUNT(*) AS n FROM users");
  if ((count?.n ?? 0) <= 1) return;
  await run("DELETE FROM users WHERE id = ?", id);
  revalidatePath("/admin/anvandare");
  redirect("/admin/anvandare?borttagen=1");
}

export async function resetUserPassword(id: number, _prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const password = String(form.get("password") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return errorState({ password: `Lösenordet måste ha minst ${MIN_PASSWORD_LENGTH} tecken.` });
  }
  if (!(await first("SELECT id FROM users WHERE id = ?", id))) return { error: "Kontot finns inte." };
  await run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(password), id);
  // Loggar ut kontot överallt, så att den som kunde det gamla lösenordet inte är kvar inloggad.
  if (id !== me.id) await run("DELETE FROM sessions WHERE user_id = ?", id);
  revalidatePath("/admin/anvandare");
  redirect("/admin/anvandare?sparat=1");
}

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("password") ?? "");
  const repeat = String(form.get("repeat") ?? "");
  const row = await first<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", me.id);
  const errors: Record<string, string> = {};
  if (!row || !(await verifyPassword(current, row.password_hash))) errors.current = "Fel nuvarande lösenord.";
  if (next.length < MIN_PASSWORD_LENGTH) errors.password = `Lösenordet måste ha minst ${MIN_PASSWORD_LENGTH} tecken.`;
  if (next !== repeat) errors.repeat = "Lösenorden matchar inte.";
  if (Object.keys(errors).length) return errorState(errors);

  await run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(next), me.id);
  await endOtherSessions(me.id);
  redirect("/admin/konto?sparat=1");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
