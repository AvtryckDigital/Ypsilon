import type { MetadataRoute } from "next";
import { all } from "@/lib/db";

export const dynamic = "force-dynamic";

type StaticRoute = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const STATIC_ROUTES: StaticRoute[] = [
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "/nyheter", changeFrequency: "daily", priority: 0.9 },
  { path: "/kalendarium", changeFrequency: "daily", priority: 0.9 },
  { path: "/om-ypsilon", changeFrequency: "monthly", priority: 0.8 },
  { path: "/sangbok", changeFrequency: "monthly", priority: 0.8 },
  { path: "/galleri", changeFrequency: "weekly", priority: 0.8 },
  { path: "/kontakt", changeFrequency: "monthly", priority: 0.8 },
  { path: "/styrelsen", changeFrequency: "monthly", priority: 0.7 },
  { path: "/historia", changeFrequency: "yearly", priority: 0.7 },
  { path: "/gammal-medlem", changeFrequency: "monthly", priority: 0.7 },
  { path: "/overypsor", changeFrequency: "yearly", priority: 0.6 },
  { path: "/hedersypsor", changeFrequency: "yearly", priority: 0.6 },
  { path: "/sitemap", changeFrequency: "monthly", priority: 0.5 },
];

function toIsoDate(dateStr: string | null | undefined): string | undefined {
  if (!dateStr) return undefined;
  try {
    const raw = dateStr.trim();
    if (!raw) return undefined;
    const normalized = raw.includes("T")
      ? raw
      : raw.includes(" ")
        ? raw.replace(" ", "T") + "Z"
        : `${raw}T00:00:00Z`;
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {
    // ignorera ogiltiga datum
  }
  return undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ypsa.se").replace(/\/$/, "");

  try {
    const [pages, posts, songs, albums, events] = await Promise.all([
      all<{ slug: string; updated_at: string }>("SELECT slug, updated_at FROM pages"),
      all<{ slug: string; updated_at: string; published_at: string }>(
        "SELECT slug, updated_at, published_at FROM posts WHERE published = 1",
      ),
      all<{ slug: string; created_at: string }>("SELECT slug, created_at FROM songs"),
      all<{ slug: string; event_date: string | null; created_at: string }>(
        "SELECT slug, event_date, created_at FROM albums WHERE published = 1",
      ),
      all<{ id: number; starts_at: string; created_at: string }>("SELECT id, starts_at, created_at FROM events"),
    ]);

    const pageUpdates = new Map(pages.map((p) => [p.slug, toIsoDate(p.updated_at)]));

    return [
      ...STATIC_ROUTES.map((route) => {
        const slug = route.path.replace(/^\//, "") || "hem";
        const lastMod = pageUpdates.get(slug);
        return {
          url: `${base}${route.path}`,
          lastModified: lastMod,
          changeFrequency: route.changeFrequency,
          priority: route.priority,
        };
      }),
      ...posts.map((p) => ({
        url: `${base}/nyheter/${p.slug}`,
        lastModified: toIsoDate(p.updated_at || p.published_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...songs.map((s) => ({
        url: `${base}/sangbok/${s.slug}`,
        lastModified: toIsoDate(s.created_at),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...albums.map((a) => ({
        url: `${base}/galleri/${a.slug}`,
        lastModified: toIsoDate(a.event_date || a.created_at),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...events.map((e) => ({
        url: `${base}/kalendarium/${e.id}`,
        lastModified: toIsoDate(e.created_at || e.starts_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch (err) {
    console.error("Fel vid generering av sitemap:", err);
    return STATIC_ROUTES.map((route) => ({
      url: `${base}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));
  }
}
