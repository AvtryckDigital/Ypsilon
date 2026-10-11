// Skapar visningsversioner av bilder i webbläsaren innan uppladdning.
// Originalet laddas upp orört bredvid, så att full upplösning alltid finns kvar.

import { SIZES } from "../images";

export type ResizedImage = {
  large: Blob;
  medium: Blob;
  thumb: Blob;
  width: number;
  height: number;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name} kunde inte läsas. Prova att spara om bilden som JPG.`));
    };
    img.src = url;
  });
}

/** Ritar bilden i en viss bredd (aldrig större än originalet) och kodar som WebP, eller JPEG om WebP saknas. */
function draw(img: HTMLImageElement, maxWidth: number, quality: number): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Bilden kunde inte bearbetas."));
        if (blob.type === "image/webp") return resolve({ blob, width, height });
        // Webbläsaren saknar WebP-kodning (äldre Safari): använd JPEG i stället.
        canvas.toBlob((jpg) => (jpg ? resolve({ blob: jpg, width, height }) : reject(new Error("Bilden kunde inte bearbetas."))), "image/jpeg", quality);
      },
      "image/webp",
      quality,
    ),
  );
}

export async function resizeImage(file: File): Promise<ResizedImage> {
  const img = await loadImage(file);
  const large = await draw(img, SIZES.large, 0.82);
  const medium = await draw(img, SIZES.medium, 0.8);
  const thumb = await draw(img, SIZES.thumb, 0.76);
  return { large: large.blob, medium: medium.blob, thumb: thumb.blob, width: large.width, height: large.height };
}

export type UploadResult = { src: string; medium?: string; thumb?: string; original?: string };

/** Laddar upp en fil eller en bild med sina versioner. Fälten skickas bara om de finns. */
export async function upload(
  folder: "bilder" | "galleri" | "filer",
  name: string,
  files: { file: Blob; medium?: Blob; thumb?: Blob; original?: Blob },
  /** Bildens mått, sparas i mediebiblioteket. */
  size?: { width: number; height: number },
): Promise<UploadResult> {
  const body = new FormData();
  body.append("folder", folder);
  body.append("name", name);
  for (const [key, blob] of Object.entries(files)) if (blob) body.append(key, blob);
  if (size) {
    body.append("width", String(size.width));
    body.append("height", String(size.height));
  }
  const res = await fetch("/admin/api/upload", { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as UploadResult & { error?: string };
  if (!res.ok || !json.src) throw new Error(json.error ?? "Uppladdningen misslyckades.");
  return json;
}
