// Datum- och texthjälp. Tider lagras som "YYYY-MM-DDTHH:MM" i svensk lokaltid
// och tolkas här utan Date-objekt, så att tidszoner aldrig kan flytta dem.

const MONTHS = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];
const WEEKDAYS = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

export type Parts = { y: number; m: number; d: number; hh: number | null; mm: number | null };

export function parseLocal(value: string | null | undefined): Parts | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;
  return {
    y: +m[1], m: +m[2], d: +m[3],
    hh: m[4] !== undefined ? +m[4] : null,
    mm: m[5] !== undefined ? +m[5] : null,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "19 januari 2026" */
export function formatDate(value: string | null | undefined, withYear = true) {
  const p = parseLocal(value);
  if (!p) return "";
  return `${p.d} ${MONTHS[p.m - 1]}${withYear ? ` ${p.y}` : ""}`;
}

/** "18:00", eller tom sträng om ingen tid finns. */
export function formatTime(value: string | null | undefined) {
  const p = parseLocal(value);
  if (!p || p.hh === null) return "";
  return `${pad(p.hh)}:${pad(p.mm ?? 0)}`;
}

export function weekday(value: string | null | undefined) {
  const p = parseLocal(value);
  if (!p) return "";
  return WEEKDAYS[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
}

export function monthName(m: number) {
  return MONTHS[m - 1];
}

export function monthShort(value: string | null | undefined) {
  const p = parseLocal(value);
  return p ? MONTHS[p.m - 1].slice(0, 3) : "";
}

export function dayOfMonth(value: string | null | undefined) {
  return parseLocal(value)?.d ?? "";
}

/** Nuvarande tid i Stockholm som "YYYY-MM-DDTHH:MM". */
export function nowStockholm() {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

export function todayStockholm() {
  return nowStockholm().slice(0, 10);
}

/** Gör en adressvänlig text: "Älggasquen 2023!" → "alggasquen-2023" */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "sida";
}

/** För sökning: gemener och utan accenter, men å/ä/ö behålls som de är. */
export function normalizeSearch(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Plockar ut första fyrsiffriga året ur en text som "1974 HT–1977". */
export function firstYear(text: string) {
  const m = text.match(/\d{4}/);
  return m ? +m[0] : 0;
}

/** Kortar en text till ungefär n tecken vid ett ordslut. */
export function truncate(text: string, n: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= n) return clean;
  return clean.slice(0, clean.lastIndexOf(" ", n)).replace(/[,.;:!?]$/, "") + "…";
}

/** Tar bort Markdown-tecken för att få fram en ren textsammanfattning. */
export function stripMarkdown(md: string) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
