import type { MetadataRoute } from "next";
import { all } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATIC = ["", "/om-ypsilon", "/historia", "/kalendarium", "/nyheter", "/sangbok", "/galleri", "/styrelsen", "/overypsor", "/hedersypsor", "/kontakt", "/gammal-medlem"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ypsa.se").replace(/\/$/, "");
  const [posts, songs, albums, events] = await Promise.all([
    all<{ slug: string; updated_at: string }>("SELECT slug, updated_at FROM posts WHERE published = 1"),
    all<{ slug: string }>("SELECT slug FROM songs"),
    all<{ slug: string }>("SELECT slug FROM albums WHERE published = 1"),
    all<{ id: number }>("SELECT id FROM events"),
  ]);
  return [
    ...STATIC.map((p) => ({ url: `${base}${p}` })),
    ...posts.map((p) => ({ url: `${base}/nyheter/${p.slug}`, lastModified: p.updated_at.replace(" ", "T") + "Z" })),
    ...songs.map((s) => ({ url: `${base}/sangbok/${s.slug}` })),
    ...albums.map((a) => ({ url: `${base}/galleri/${a.slug}` })),
    ...events.map((e) => ({ url: `${base}/kalendarium/${e.id}` })),
  ];
}
