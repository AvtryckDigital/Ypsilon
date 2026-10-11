export type Page = { slug: string; title: string; intro: string | null; body: string | null; image: string | null; updated_at: string };
export type Post = { id: number; slug: string; title: string; excerpt: string | null; body: string | null; cover: string | null; author: string | null; published: number; published_at: string };
export type EventKind = "yra" | "vanlig" | "extern";
export type YEvent = { id: number; title: string; starts_at: string; ends_at: string | null; location: string | null; description: string | null; kind: EventKind; link: string | null; poster: string | null };
export type Song = { id: number; slug: string; title: string; number: number | null; category: string | null; melody: string | null; lyrics: string; notes: string | null };
export type BoardMember = { id: number; role: string; role_description: string | null; name: string; email: string | null; image: string | null; sort_order: number };
export type FormerChair = { id: number; period: string; name: string; note: string | null; image: string | null; sort_year: number; sort_order: number };
export type HonoraryMember = { id: number; year: number; name: string; motivation: string | null; image: string | null };
export type Contact = { id: number; role: string; email: string; description: string | null; sort_order: number };
export type Album = { id: number; slug: string; title: string; description: string | null; photographer: string | null; event_date: string | null; year: number | null; cover: string | null; published: number; image_count?: number; first_thumb?: string | null; cover_src?: string | null; cover_medium?: string | null; cover_width?: number | null };
export type AlbumImage = { id: number; album_id: number; src: string; thumb: string; medium: string | null; original: string | null; width: number | null; height: number | null; caption: string | null; sort_order: number };
export type User = { id: number; email: string; name: string | null };
export type Settings = Record<string, string>;

/** Bilder och album i bildväljaren i admin. */
export type PickerImage = { src: string; thumb: string; name: string | null; width: number | null; height: number | null };
export type PickerAlbum = { id: number; title: string; published: number; count: number };
