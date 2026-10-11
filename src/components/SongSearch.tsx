"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Dices, Search, X } from "lucide-react";

export type SongListItem = {
  slug: string;
  title: string;
  number: number | null;
  category: string | null;
  melody: string | null;
  lyrics: string;
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Returnerar en rad ur texten som innehåller sökordet, så att man ser varför sången matchade. */
function matchingLine(lyrics: string, q: string) {
  const line = lyrics.split(/\r?\n/).find((l) => norm(l).includes(q));
  return line?.trim() ?? null;
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-[#c5a059]/35 px-0.5 text-inherit">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function SongSearch({ songs }: { songs: SongListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const q = norm(query);

  const categories = useMemo(
    () => [...new Set(songs.map((s) => s.category).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b, "sv")),
    [songs],
  );

  const results = useMemo(() => {
    return songs
      .filter((s) => !category || s.category === category)
      .map((s) => {
        if (!q) return { song: s, line: null as string | null, rank: 0 };
        const inTitle = norm(s.title).includes(q) || String(s.number ?? "") === q;
        const inMelody = s.melody ? norm(s.melody).includes(q) : false;
        const line = !inTitle ? matchingLine(s.lyrics, q) : null;
        if (!inTitle && !inMelody && !line) return null;
        return { song: s, line, rank: inTitle ? 0 : inMelody ? 1 : 2 };
      })
      .filter((x): x is { song: SongListItem; line: string | null; rank: number } => !!x)
      .sort((a, b) => a.rank - b.rank);
  }, [songs, q, category]);

  const handleRandomSong = () => {
    const pool = results.length > 0 ? results.map((r) => r.song) : songs;
    if (pool.length === 0) return;
    const randomSong = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/sangbok/${randomSong.slug}`);
  };

  return (
    <div>
      <div className="sticky top-[calc(4.5rem+10px)] z-10 -mx-4 bg-ivory/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <label htmlFor="sok" className="sr-only">Sök i sångboken</label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-warm-muted" aria-hidden />
            <input
              id="sok"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök på titel, melodi eller en rad ur texten…"
              autoComplete="off"
              className="w-full rounded-sm border border-[#ded3c2] bg-[#fbf9f5] py-3.5 pl-12 pr-12 text-[1.05rem] shadow-sm outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Rensa sökningen"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-warm-muted hover:bg-linen hover:text-warm"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleRandomSong}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-[#c5a059]/40 bg-[#0d0f14] px-5 py-3.5 font-serif text-xs font-semibold uppercase tracking-[0.16em] text-[#dfbe76] shadow-sm transition hover:border-[#c5a059] hover:bg-[#131620] active:translate-y-0"
            title="Öppna en slumpmässig visa ur sångboken"
          >
            <Dices size={16} className="text-[#dfbe76]" />
            <span>Slumpa visa</span>
          </button>
        </div>
        {categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrera på kategori">
            {["", ...categories].map((c) => (
              <button
                key={c || "alla"}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`rounded-sm px-3.5 py-1.5 font-serif text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                  category === c
                    ? "border border-[#c5a059] bg-[#0d0f14] text-[#dfbe76]"
                    : "border border-[#ded3c2] bg-[#fbf9f5] text-warm hover:border-[#c5a059]/60 hover:bg-white"
                }`}
              >
                {c || "Alla"}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mb-4 mt-2 font-serif text-xs uppercase tracking-wider text-warm-muted" aria-live="polite">
        {q || category ? `${results.length} ${results.length === 1 ? "sång" : "sånger"} hittades` : `${songs.length} sånger`}
      </p>

      {results.length === 0 ? (
        <p className="rounded-sm border border-dashed border-[#ded3c2] bg-[#fbf9f5] px-6 py-12 text-center text-warm-muted shadow-sm">
          Ingen sång matchade sökningen.
        </p>
      ) : (
        <ul className="divide-y divide-[#ded3c2]/70 overflow-hidden rounded-sm border border-[#ded3c2] bg-[#fbf9f5] shadow-sm">
          {results.map(({ song, line }) => (
            <li key={song.slug}>
              <Link href={`/sangbok/${song.slug}`} className="group flex gap-4 px-5 py-4 transition-colors hover:bg-white/80">
                <span className="w-9 shrink-0 pt-0.5 text-right font-display text-xl text-[#8c6b2d]" aria-hidden>
                  {song.number ?? ""}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[1.45rem] leading-snug text-warm group-hover:text-[#8c6b2d]">
                    <Highlight text={song.title} q={q} />
                  </span>
                  <span className="block font-serif text-[0.93rem] text-warm-muted">
                    {song.melody && <>Mel: <Highlight text={song.melody} q={q} /></>}
                    {song.melody && song.category && " · "}
                    {song.category}
                  </span>
                  {line && (
                    <span className="mt-1 block truncate font-serif text-[0.93rem] italic text-warm/75">
                      ”<Highlight text={line} q={q} />”
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
