"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, EyeOff, Images, Loader2, Search, X } from "lucide-react";
import type { PickerAlbum, PickerImage } from "@/lib/types";

type Source = "bibliotek" | number;

// Dialog där man väljer en bild som redan finns: från biblioteket eller från ett album i galleriet.
export default function MediaPicker({
  current,
  onSelect,
  onClose,
}: {
  current?: string;
  onSelect: (src: string) => void;
  onClose: () => void;
}) {
  const [library, setLibrary] = useState<PickerImage[] | null>(null);
  const [albums, setAlbums] = useState<PickerAlbum[]>([]);
  const [albumImages, setAlbumImages] = useState<Record<number, PickerImage[]>>({});
  const [source, setSource] = useState<Source>("bibliotek");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/admin/api/media")
      .then((r) => (r.ok ? (r.json() as Promise<{ library: PickerImage[]; albums: PickerAlbum[] }>) : Promise.reject()))
      .then((d) => {
        setLibrary(d.library);
        setAlbums(d.albums);
      })
      .catch(() => setError("Bilderna kunde inte hämtas. Ladda om sidan och försök igen."));
  }, []);

  useEffect(() => {
    if (typeof source !== "number" || albumImages[source]) return;
    fetch(`/admin/api/media?album=${source}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ images: PickerImage[] }>) : Promise.reject()))
      .then((d) => setAlbumImages((m) => ({ ...m, [source]: d.images })))
      .catch(() => setError("Albumet kunde inte hämtas."));
  }, [source, albumImages]);

  // Stäng med Escape och håll fokus i dialogen medan den är öppen.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [onClose]);

  const images = source === "bibliotek" ? library : albumImages[source] ?? null;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!images || !q) return images;
    return images.filter((i) => i.name?.toLowerCase().includes(q));
  }, [images, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 p-0 sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        tabIndex={-1}
        className="flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl outline-none sm:h-[85vh] sm:rounded-xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id="media-picker-title" className="text-2xl text-navy">Välj en bild</h2>
          <button type="button" onClick={onClose} className="rounded p-1.5 text-muted hover:bg-cream hover:text-navy" aria-label="Stäng">
            <X size={22} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          {/* Källor */}
          <nav aria-label="Var bilderna finns" className="shrink-0 overflow-x-auto border-b border-line bg-cream/40 sm:w-60 sm:overflow-y-auto sm:border-b-0 sm:border-r">
            <ul className="flex gap-1 p-2 sm:flex-col">
              <li>
                <SourceButton active={source === "bibliotek"} onClick={() => setSource("bibliotek")}>
                  <Images size={16} aria-hidden className="shrink-0" />
                  <span className="truncate">Biblioteket</span>
                  {library && <span className="ml-auto text-xs opacity-60">{library.length}</span>}
                </SourceButton>
              </li>
              {albums.length > 0 && (
                <li className="hidden px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted sm:block">Album</li>
              )}
              {albums.map((a) => (
                <li key={a.id}>
                  <SourceButton active={source === a.id} onClick={() => setSource(a.id)}>
                    <span className="truncate">{a.title}</span>
                    {!a.published && <EyeOff size={14} className="shrink-0 opacity-60" aria-label="Opublicerat" />}
                    <span className="ml-auto text-xs opacity-60">{a.count}</span>
                  </SourceButton>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bilder */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-line p-3">
              <label className="relative block">
                <span className="sr-only">Sök bland bilderna</span>
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={source === "bibliotek" ? "Sök på namn" : "Sök på bildtext"}
                  className="w-full rounded-md border border-line py-2 pl-9 pr-3 focus:border-royal focus:outline-none"
                />
              </label>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {error ? (
                <p className="p-6 text-center text-red-700" role="alert">{error}</p>
              ) : !shown ? (
                <p className="flex items-center justify-center gap-2 p-10 text-muted" role="status">
                  <Loader2 size={18} className="animate-spin" aria-hidden /> Hämtar bilder…
                </p>
              ) : shown.length === 0 ? (
                <p className="p-10 text-center text-muted">
                  {query ? "Inga bilder matchar sökningen." : source === "bibliotek" ? "Biblioteket är tomt. Bilder som laddas upp hamnar här." : "Albumet är tomt."}
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {shown.map((img) => {
                    const selected = img.src === current;
                    return (
                      <li key={img.src}>
                        <button
                          type="button"
                          onClick={() => onSelect(img.src)}
                          className={`group relative block w-full overflow-hidden rounded-lg border bg-cream text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-royal ${
                            selected ? "border-gold-deep ring-2 ring-gold" : "border-line hover:border-navy/40"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.thumb} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition group-hover:opacity-90" />
                          {selected && (
                            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-navy-deep">
                              <Check size={14} aria-hidden />
                            </span>
                          )}
                          {img.name && <span className="block truncate px-2 py-1.5 text-xs text-muted">{img.name}</span>}
                          {selected && <span className="sr-only">Vald nu</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`flex w-full items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-left text-[0.95rem] sm:whitespace-normal ${
        active ? "bg-navy font-semibold text-white" : "text-navy hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}
