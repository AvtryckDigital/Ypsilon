// Bildstorlekar som delas av servern, webbläsaren och migreringsskriptet.

export const SIZES = { thumb: 640, medium: 1400, large: 2800 } as const;

export type SizedImage = {
  src: string;
  thumb: string;
  medium?: string | null;
  width?: number | null;
};

/**
 * Bygger ett srcset så att webbläsaren väljer den minsta version som räcker för skärmen.
 * Äldre bilder utan mellanstorlek (sparade innan flera storlekar infördes) får två steg.
 */
export function srcSet(img: SizedImage) {
  const w = img.width || SIZES.large;
  if (!img.medium) {
    if (img.thumb === img.src) return undefined;
    return `${img.thumb} ${Math.min(480, w)}w, ${img.src} ${w}w`;
  }
  return [
    `${img.thumb} ${Math.min(SIZES.thumb, w)}w`,
    `${img.medium} ${Math.min(SIZES.medium, w)}w`,
    `${img.src} ${w}w`,
  ].join(", ");
}
