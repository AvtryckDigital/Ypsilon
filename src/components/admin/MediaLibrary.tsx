"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { Copy, Loader2, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { removeLibraryImage, renameLibraryImage, scanMediaLibrary } from "@/app/admin/actions";
import { resizeImage, upload } from "@/lib/admin/resize";

type Image = {
  id: number;
  src: string;
  medium: string | null;
  thumb: string | null;
  name: string | null;
  width: number | null;
  height: number | null;
  size: number | null;
  created_at: string;
  usedIn: string[];
};

const PARALLEL = 3;

function formatSize(bytes: number | null) {
  if (!bytes) return null;
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.round(bytes / 1024)} kB`;
}

// Biblioteket i admin: ladda upp, byt namn, se var bilderna används och radera dem.
export default function MediaLibrary({ images }: { images: Image[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number; failed: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"alla" | "anvands" | "sparade">("alla");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const uploading = progress !== null && progress.done < progress.total;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return images.filter(
      (i) =>
        (!q || i.name?.toLowerCase().includes(q)) &&
        (filter === "alla" || (filter === "anvands" ? i.usedIn.length > 0 : i.usedIn.length === 0)),
    );
  }, [images, query, filter]);
  const unusedCount = images.filter((i) => i.usedIn.length === 0).length;

  async function uploadFiles(fileList: FileList | File[]) {
    const files = [...fileList].filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    setMessage(null);
    const failed: string[] = [];
    let done = 0;
    setProgress({ done, total: files.length, failed });
    const queue = [...files];
    async function worker() {
      while (queue.length) {
        const file = queue.shift()!;
        try {
          const r = await resizeImage(file);
          await upload("bilder", file.name.replace(/\.[^.]+$/, ""), { file: r.large, medium: r.medium, thumb: r.thumb }, { width: r.width, height: r.height });
        } catch {
          failed.push(file.name);
        }
        done++;
        setProgress({ done, total: files.length, failed: [...failed] });
      }
    }
    await Promise.all(Array.from({ length: Math.min(PARALLEL, files.length) }, worker));
    if (input.current) input.current.value = "";
    router.refresh();
  }

  function scan() {
    setMessage(null);
    start(async () => {
      const { added } = await scanMediaLibrary();
      setMessage({ text: added ? `${added} äldre bilder lades till i biblioteket.` : "Inga fler bilder hittades. Biblioteket är komplett." });
      router.refresh();
    });
  }

  function remove(img: Image) {
    if (!confirm(`Radera ”${img.name || "bilden"}” för gott? Det går inte att ångra.`)) return;
    setMessage(null);
    start(async () => {
      const { usedIn } = await removeLibraryImage(img.id);
      if (usedIn.length) setMessage({ text: `Bilden används och raderades inte. Byt först ut den här: ${usedIn.join(", ")}.`, error: true });
      router.refresh();
    });
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!uploading) uploadFiles(e.dataTransfer.files);
        }}
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragOver ? "border-royal bg-royal/5" : "border-line bg-white"}`}
      >
        {uploading ? (
          <div role="status" aria-live="polite">
            <Loader2 size={28} className="mx-auto animate-spin text-navy" aria-hidden />
            <p className="mt-2 font-semibold text-navy">Laddar upp {progress!.done} av {progress!.total} bilder…</p>
            <div className="mx-auto mt-3 h-2 max-w-sm overflow-hidden rounded-full bg-cream">
              <div className="h-full bg-navy transition-all" style={{ width: `${(progress!.done / progress!.total) * 100}%` }} />
            </div>
          </div>
        ) : (
          <>
            <Upload size={28} className="mx-auto text-navy" aria-hidden />
            <p className="mt-2 font-semibold text-navy">Dra bilder hit eller</p>
            <button type="button" onClick={() => input.current?.click()} className="admin-btn-primary mt-3">
              Välj bilder
            </button>
            <p className="mt-2 text-sm text-muted">Bilderna sparas här utan att visas på hemsidan, tills du väljer dem någonstans.</p>
          </>
        )}
        <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
      </div>

      {progress && !uploading && (
        <p className={`mt-3 text-sm ${progress.failed.length ? "text-red-700" : "text-emerald-800"}`} role="status">
          {progress.total - progress.failed.length} av {progress.total} bilder laddades upp.
          {progress.failed.length > 0 && <> Följande gick inte: {progress.failed.join(", ")}</>}
        </p>
      )}
      {message && (
        <p className={`mt-3 text-sm ${message.error ? "text-red-700" : "text-emerald-800"}`} role={message.error ? "alert" : "status"}>
          {message.text}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[14rem] flex-1">
          <span className="sr-only">Sök på namn</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök på namn"
            className="w-full rounded-md border border-line bg-white py-2 pl-9 pr-3 focus:border-royal focus:outline-none"
          />
        </label>
        <div role="group" aria-label="Visa" className="flex overflow-hidden rounded-md border border-line bg-white text-sm">
          {([
            ["alla", `Alla (${images.length})`],
            ["anvands", `Används (${images.length - unusedCount})`],
            ["sparade", `Bara sparade (${unusedCount})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 font-semibold ${filter === key ? "bg-navy text-white" : "text-navy hover:bg-cream"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={scan} disabled={pending} className="admin-btn-secondary" title="Lägger till bilder som laddades upp innan biblioteket fanns">
          {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <RefreshCw size={16} aria-hidden />} Hämta äldre bilder
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="mt-8 rounded-lg border border-line bg-white p-10 text-center text-muted">
          {images.length === 0 ? "Biblioteket är tomt. Ladda upp bilder ovan, eller hämta bilder som laddats upp tidigare." : "Inga bilder matchar."}
        </p>
      ) : (
        <ul className={`mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${pending ? "opacity-70" : ""}`}>
          {shown.map((img) => (
            <li key={img.id} className="flex flex-col overflow-hidden rounded-lg border border-line bg-white">
              <a href={img.src} target="_blank" rel="noopener noreferrer" className="relative block bg-cream" title="Öppna i full storlek">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.thumb ?? img.medium ?? img.src} alt={img.name ?? ""} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    img.usedIn.length ? "bg-emerald-700 text-white" : "bg-white/90 text-navy"
                  }`}
                >
                  {img.usedIn.length ? "Används" : "Bara sparad"}
                </span>
              </a>
              <div className="flex flex-1 flex-col p-2">
                <input
                  defaultValue={img.name ?? ""}
                  placeholder="Namn"
                  aria-label="Bildens namn"
                  onBlur={(e) => {
                    if (e.target.value !== (img.name ?? "")) start(() => renameLibraryImage(img.id, e.target.value));
                  }}
                  className="w-full rounded border border-transparent px-2 py-1 text-sm font-semibold text-navy hover:border-line focus:border-royal focus:outline-none"
                />
                <p className="px-2 text-xs text-muted">
                  {[img.width && img.height ? `${img.width}×${img.height}` : null, formatSize(img.size), img.created_at.slice(0, 10)].filter(Boolean).join(" · ")}
                </p>
                {img.usedIn.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 px-2 text-xs text-emerald-900">
                    {img.usedIn.map((w) => (
                      <li key={w} className="truncate" title={w}>{w}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(new URL(img.src, location.origin).href);
                      setMessage({ text: "Bildens adress är kopierad." });
                    }}
                    className="rounded p-1.5 text-muted hover:bg-cream hover:text-navy"
                    aria-label="Kopiera bildens adress"
                    title="Kopiera bildens adress"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(img)}
                    className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-700"
                    aria-label="Radera bilden"
                    title={img.usedIn.length ? "Bilden används och kan inte raderas förrän den bytts ut" : "Radera bilden"}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
