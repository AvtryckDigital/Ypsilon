import "server-only";
import { all, first } from "./db";
import { nowStockholm } from "./format";
import type {
  Album, AlbumImage, BoardMember, Contact, FormerChair, HonoraryMember,
  Page, Post, Settings, Song, YEvent,
} from "./types";

export async function getSettings(): Promise<Settings> {
  try {
    const rows = await all<{ key: string; value: string | null }>("SELECT key, value FROM settings");
    return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
  } catch {
    return {} as Settings;
  }
}

export async function getPage(slug: string) {
  return first<Page>("SELECT * FROM pages WHERE slug = ?", slug);
}

export async function getPosts(limit = 200, offset = 0) {
  return all<Post>(
    `SELECT id, slug, title, excerpt, cover, author, published, published_at, NULL AS body
     FROM posts WHERE published = 1 ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`,
    limit, offset,
  );
}

export async function countPosts() {
  return (await first<{ n: number }>("SELECT COUNT(*) AS n FROM posts WHERE published = 1"))?.n ?? 0;
}

export async function getPost(slug: string) {
  return first<Post>("SELECT * FROM posts WHERE slug = ? AND published = 1", slug);
}

/** Granne före och efter ett inlägg, för navigering längst ner. */
export async function getAdjacentPosts(post: Post) {
  const [newer, older] = await Promise.all([
    first<Pick<Post, "slug" | "title">>(
      `SELECT slug, title FROM posts WHERE published = 1 AND (published_at > ? OR (published_at = ? AND id > ?))
       ORDER BY published_at ASC, id ASC LIMIT 1`,
      post.published_at, post.published_at, post.id,
    ),
    first<Pick<Post, "slug" | "title">>(
      `SELECT slug, title FROM posts WHERE published = 1 AND (published_at < ? OR (published_at = ? AND id < ?))
       ORDER BY published_at DESC, id DESC LIMIT 1`,
      post.published_at, post.published_at, post.id,
    ),
  ]);
  return { newer, older };
}

/** Evenemang som inte har passerat. Ett evenemang räknas som pågående hela sin startdag. */
export async function getUpcomingEvents(limit = 100) {
  const today = nowStockholm().slice(0, 10);
  return all<YEvent>(
    "SELECT * FROM events WHERE COALESCE(ends_at, starts_at) >= ? ORDER BY starts_at ASC LIMIT ?",
    today, limit,
  );
}

export async function getPastEvents(sinceDate: string) {
  const today = nowStockholm().slice(0, 10);
  return all<YEvent>(
    "SELECT * FROM events WHERE COALESCE(ends_at, starts_at) < ? AND starts_at >= ? ORDER BY starts_at DESC",
    today, sinceDate,
  );
}

export async function getEvent(id: number) {
  return first<YEvent>("SELECT * FROM events WHERE id = ?", id);
}

export async function getAllEvents() {
  return all<YEvent>("SELECT * FROM events ORDER BY starts_at ASC");
}

export async function getSongs() {
  return all<Song>(
    "SELECT * FROM songs ORDER BY CASE WHEN number IS NULL THEN 1 ELSE 0 END, number, title COLLATE NOCASE",
  );
}

export async function getSong(slug: string) {
  return first<Song>("SELECT * FROM songs WHERE slug = ?", slug);
}

export async function getBoard() {
  return all<BoardMember>("SELECT * FROM board_members ORDER BY sort_order, id");
}

export async function getFormerChairs() {
  return all<FormerChair>("SELECT * FROM former_chairs ORDER BY sort_year, sort_order, id");
}

export async function getHonoraryMembers() {
  return all<HonoraryMember>("SELECT * FROM honorary_members ORDER BY year, id");
}

export async function getContacts() {
  return all<Contact>("SELECT * FROM contacts ORDER BY sort_order, id");
}

export async function getAlbums() {
  return all<Album>(
    `SELECT a.*,
       (SELECT COUNT(*) FROM album_images i WHERE i.album_id = a.id) AS image_count,
       c.thumb AS first_thumb, c.src AS cover_src, c.medium AS cover_medium, c.width AS cover_width
     FROM albums a
     LEFT JOIN album_images c ON c.id = COALESCE(
       (SELECT id FROM album_images WHERE album_id = a.id AND (thumb = a.cover OR src = a.cover) LIMIT 1),
       (SELECT id FROM album_images WHERE album_id = a.id ORDER BY sort_order, id LIMIT 1))
     WHERE a.published = 1
     ORDER BY COALESCE(CAST(substr(a.event_date, 1, 4) AS INTEGER), a.year, CAST(substr(a.created_at, 1, 4) AS INTEGER)) DESC,
       a.event_date DESC, a.id DESC`,
  );
}

export type Photo = {
  id: number;
  src: string;
  thumb: string;
  medium: string | null;
  width: number | null;
  height: number | null;
  album_slug: string;
  album_title: string;
};

const ALBUM_ORDER = `COALESCE(CAST(substr(a.event_date, 1, 4) AS INTEGER), a.year, CAST(substr(a.created_at, 1, 4) AS INTEGER)) DESC,
  a.event_date DESC, a.id DESC`;

/**
 * En bild per album från de senaste albumen: omslaget om det är valt,
 * annars albumets första liggande bild. Används på startsidan.
 */
export async function getRecentAlbumPhotos(limit = 8) {
  return all<Photo>(
    `SELECT i.id, i.src, i.thumb, i.medium, i.width, i.height, a.slug AS album_slug, a.title AS album_title
     FROM albums a
     JOIN album_images i ON i.id = COALESCE(
       (SELECT id FROM album_images WHERE album_id = a.id AND (thumb = a.cover OR src = a.cover) LIMIT 1),
       (SELECT id FROM album_images WHERE album_id = a.id AND width > height ORDER BY sort_order, id LIMIT 1),
       (SELECT id FROM album_images WHERE album_id = a.id ORDER BY sort_order, id LIMIT 1))
     WHERE a.published = 1
     ORDER BY ${ALBUM_ORDER}
     LIMIT ?`,
    limit,
  );
}

/** En bild per album från de äldsta albumen, för historiesidan. */
export async function getOldestAlbumPhotos(limit = 3) {
  return all<Photo>(
    `SELECT i.id, i.src, i.thumb, i.medium, i.width, i.height, a.slug AS album_slug, a.title AS album_title
     FROM albums a
     JOIN album_images i ON i.id = COALESCE(
       (SELECT id FROM album_images WHERE album_id = a.id AND (thumb = a.cover OR src = a.cover) LIMIT 1),
       (SELECT id FROM album_images WHERE album_id = a.id ORDER BY sort_order, id LIMIT 1))
     WHERE a.published = 1
     ORDER BY COALESCE(CAST(substr(a.event_date, 1, 4) AS INTEGER), a.year, CAST(substr(a.created_at, 1, 4) AS INTEGER)) ASC, a.id ASC
     LIMIT ?`,
    limit,
  );
}

/** Fler bilder från de senaste albumen, när det finns för få album för att fylla en mosaik. */
export async function getMorePhotos(excludeIds: number[], limit: number) {
  const exclude = excludeIds.length ? `AND i.id NOT IN (${excludeIds.map(() => "?").join(",")})` : "";
  return all<Photo>(
    `SELECT i.id, i.src, i.thumb, i.medium, i.width, i.height, a.slug AS album_slug, a.title AS album_title
     FROM album_images i JOIN albums a ON a.id = i.album_id
     WHERE a.published = 1 AND i.width > i.height ${exclude}
     ORDER BY ${ALBUM_ORDER}, i.sort_order
     LIMIT ?`,
    ...excludeIds,
    limit,
  );
}

export async function getAlbum(slug: string) {
  const album = await first<Album>("SELECT * FROM albums WHERE slug = ? AND published = 1", slug);
  if (!album) return null;
  const images = await all<AlbumImage>(
    "SELECT * FROM album_images WHERE album_id = ? ORDER BY sort_order, id", album.id,
  );
  return { album, images };
}

/** Hämtar en specifik bild med dess metadata (för srcset och upplösning). */
export async function getPhotoBySrc(src: string) {
  return first<Photo>(
    `SELECT i.id, i.src, i.thumb, i.medium, i.width, i.height, a.slug AS album_slug, a.title AS album_title
     FROM album_images i JOIN albums a ON a.id = i.album_id
     WHERE i.src = ? OR i.medium = ? OR i.thumb = ? LIMIT 1`,
    src, src, src,
  );
}

