import { getUser } from "@/lib/auth";
import { first, run } from "@/lib/db";
import { isAllowedType, putMedia } from "@/lib/media";
import { registerImage } from "@/lib/media-library";

const MAX_BYTES = 40 * 1024 * 1024;
// Spärr på 9.9 GB för att aldrig överskrida Cloudflares gratiskvot (10 GB)
const MAX_STORAGE_BYTES = 9.9 * 1024 * 1024 * 1024;
const FOLDERS = new Set(["bilder", "galleri", "filer"]);
// Original från mobiler kan vara HEIC; de sparas som de är men visas via de förminskade versionerna.
const ORIGINAL_EXTRA = new Set(["image/heic", "image/heif", "image/tiff"]);

// Tar emot filer från admin. Bilder förminskas i webbläsaren; fälten är
// file (största versionen), medium, thumb och original (filen som den var).
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Du är inte inloggad." }, { status: 401 });

  const form = await req.formData();
  const folder = String(form.get("folder") ?? "bilder");
  const name = String(form.get("name") ?? "bild").replace(/\.[^.]+$/, "");
  if (!FOLDERS.has(folder)) return Response.json({ error: "Ogiltig mapp." }, { status: 400 });

  const blobs: Record<string, Blob> = {};
  for (const key of ["file", "medium", "thumb", "original"]) {
    const value = form.get(key);
    if (!(value instanceof Blob) || value.size === 0) continue;
    const allowed = isAllowedType(value.type) || (key === "original" && ORIGINAL_EXTRA.has(value.type));
    if (!allowed) return Response.json({ error: "Filtypen stöds inte. Använd JPG, PNG, WebP, GIF eller PDF." }, { status: 400 });
    if (value.size > MAX_BYTES) return Response.json({ error: "Filen är större än 40 MB." }, { status: 400 });
    blobs[key] = value;
  }
  if (!blobs.file) return Response.json({ error: "Ingen fil skickades." }, { status: 400 });

  // Kontrollera total lagringsanvändning så att vi inte överskrider gratiskvoten (10 GB)
  const incomingBytes = Object.values(blobs).reduce((sum, b) => sum + b.size, 0);
  const storageRow = await first<{ value: string }>("SELECT value FROM settings WHERE key = 'r2_storage_bytes'");
  let currentBytes = storageRow?.value ? Number(storageRow.value) : null;
  if (currentBytes === null || Number.isNaN(currentBytes)) {
    const sumRow = await first<{ total: number }>("SELECT COALESCE(SUM(size), 0) AS total FROM media");
    currentBytes = sumRow?.total ?? 0;
  }

  if (currentBytes + incomingBytes > MAX_STORAGE_BYTES) {
    return Response.json(
      { error: "Lagringen för bilder är full, meddela era admins!" },
      { status: 400 }
    );
  }

  const src = await putMedia(folder, blobs.file, name);
  const result: Record<string, string> = { src, medium: src, thumb: src };
  if (blobs.medium) result.medium = await putMedia(folder, blobs.medium, `${name}-1400`);
  if (blobs.thumb) result.thumb = await putMedia(folder, blobs.thumb, `${name}-640`);
  if (blobs.original) result.original = await putMedia(folder, blobs.original, `${name}-original`);

  // Uppdatera summerad lagringsanvändning
  await run(
    "INSERT INTO settings (key, value) VALUES ('r2_storage_bytes', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    String(currentBytes + incomingBytes)
  );

  // Bilder utanför galleriet sparas i biblioteket, så att de kan väljas igen senare.
  if (folder === "bilder" && blobs.file.type.startsWith("image/")) {
    const dim = (key: string) => {
      const n = Number(form.get(key));
      return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
    };
    await registerImage({
      src,
      medium: blobs.medium ? result.medium : null,
      thumb: blobs.thumb ? result.thumb : null,
      name: name.slice(0, 120),
      width: dim("width"),
      height: dim("height"),
      size: blobs.file.size,
    });
  }
  return Response.json(result);
}
