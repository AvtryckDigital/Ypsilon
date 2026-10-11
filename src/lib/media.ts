import "server-only";
import { getEnv } from "./cf";

/** Alla uppladdade filer serveras från /media/<nyckel>. */
export const MEDIA_PREFIX = "/media/";

export function mediaUrl(key: string) {
  return MEDIA_PREFIX + key;
}

export function keyFromUrl(url: string | null | undefined) {
  if (!url || !url.startsWith(MEDIA_PREFIX)) return null;
  return decodeURIComponent(url.slice(MEDIA_PREFIX.length));
}

/** Tar bort filer i R2 som hör till de angivna adresserna. Externa adresser lämnas orörda. */
export async function deleteMedia(...urls: (string | null | undefined)[]) {
  const keys = urls.map(keyFromUrl).filter((k): k is string => !!k);
  if (keys.length === 0) return;
  const { MEDIA } = await getEnv();
  await MEDIA.delete(keys);
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "application/pdf"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/gif": "gif", "image/avif": "avif", "application/pdf": "pdf",
  "image/heic": "heic", "image/heif": "heif", "image/tiff": "tif",
};

export function isAllowedType(type: string) {
  return ALLOWED.has(type);
}

/** Sparar en fil i R2 och returnerar dess adress. */
export async function putMedia(folder: string, file: Blob, baseName: string) {
  const { MEDIA } = await getEnv();
  const ext = EXT[file.type] ?? "bin";
  const safe = baseName.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "fil";
  const key = `${folder}/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID().slice(0, 8)}-${safe}.${ext}`;
  await MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
  });
  return mediaUrl(key);
}
