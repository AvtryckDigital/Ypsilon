"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Loader2, Star, Trash2, Upload } from "lucide-react";
import {
  addAlbumImages, deleteAlbumImage, moveAlbumImage, setAlbumCover, updateImageCaption,
} from "@/app/admin/actions";
import { resizeImage, upload as uploadImage } from "@/lib/admin/resize";
import type { AlbumImage } from "@/lib/types";

const PARALLEL = 3;

export default function AlbumImages({ albumId, images, cover }: { albumId: number; images: AlbumImage[]; cover: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number; failed: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, start] = useTransition();
  const uploading = progress !== null && progress.done < progress.total;

  async function upload(fileList: FileList | File[]) {
    const files = [...fileList].filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    const failed: string[] = [];
    let done = 0;
    setProgress({ done, total: files.length, failed });

    const queue = [...files];
    let buffer: Parameters<typeof addAlbumImages>[1] = [];
    const flush = async () => {
      if (buffer.length === 0) return;
      const batch = buffer;
      buffer = [];
      await addAlbumImages(albumId, batch);
    };

    async function worker() {
      while (queue.length) {
        const file = queue.shift()!;
        try {
          const r = await resizeImage(file);
          // Originalet laddas upp orört så att full upplösning finns kvar för nedladdning.
          const res = await uploadImage("galleri", file.name, { file: r.large, medium: r.medium, thumb: r.thumb, original: file });
          buffer.push({
            src: res.src,
            medium: res.medium ?? null,
            thumb: res.thumb ?? res.src,
            original: res.original ?? null,
            width: r.width || null,
            height: r.height || null,
          });
          // Spara löpande så att inget går förlorat om sidan stängs mitt i.
          if (buffer.length >= 10) await flush();
        } catch {
          failed.push(file.name);
        }
        done++;
        setProgress({ done, total: files.length, failed: [...failed] });
      }
    }

    await Promise.all(Array.from({ length: Math.min(PARALLEL, files.length) }, worker));
    await flush();
    if (input.current) input.current.value = "";
    router.refresh();
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
          if (!uploading) upload(e.dataTransfer.files);
        }}
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-royal bg-royal/5" : "border-line bg-white"
        }`}
      >
        {uploading ? (
          <div role="status" aria-live="polite">
            <Loader2 size={28} className="mx-auto animate-spin text-navy" aria-hidden />
            <p className="mt-2 font-semibold text-navy">Laddar upp {progress!.done} av {progress!.total} bilder…</p>
            <div className="mx-auto mt-3 h-2 max-w-sm overflow-hidden rounded-full bg-cream">
              <div className="h-full bg-navy transition-all" style={{ width: `${(progress!.done / progress!.total) * 100}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted">Låt sidan vara öppen tills uppladdningen är klar.</p>
          </div>
        ) : (
          <>
            <Upload size={28} className="mx-auto text-navy" aria-hidden />
            <p className="mt-2 font-semibold text-navy">Dra bilder hit eller</p>
            <button type="button" onClick={() => input.current?.click()} className="admin-btn-primary mt-3">
              Välj bilder
            </button>
          </>
        )}
        <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
      </div>

      {progress && !uploading && (
        <p className={`mt-3 text-sm ${progress.failed.length ? "text-red-700" : "text-emerald-800"}`} role="status">
          {progress.total - progress.failed.length} av {progress.total} bilder laddades upp.
          {progress.failed.length > 0 && <> Följande gick inte: {progress.failed.join(", ")}</>}
        </p>
      )}

      {images.length > 0 && (
        <>
          <p className="mb-3 mt-6 text-sm text-muted">
            {images.length} bilder. Bildtexten sparas när du klickar utanför rutan.
          </p>
          <ul className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${pending ? "opacity-70" : ""}`}>
            {images.map((img, i) => {
              const isCover = cover === img.thumb || cover === img.src;
              return (
                <li key={img.id} className={`overflow-hidden rounded-lg border bg-white ${isCover ? "border-gold-deep ring-2 ring-gold" : "border-line"}`}>
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.thumb} alt={img.caption ?? ""} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    {isCover && (
                      <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-navy-deep">Omslag</span>
                    )}
                  </div>
                  <div className="p-2">
                    <input
                      defaultValue={img.caption ?? ""}
                      placeholder="Bildtext"
                      aria-label={`Bildtext för bild ${i + 1}`}
                      onBlur={(e) => {
                        if (e.target.value !== (img.caption ?? "")) start(() => updateImageCaption(img.id, e.target.value));
                      }}
                      className="w-full rounded border border-transparent px-2 py-1 text-sm hover:border-line focus:border-royal focus:outline-none"
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex">
                        <button type="button" disabled={i === 0} onClick={() => start(() => moveAlbumImage(img.id, "up"))} className="rounded p-1.5 text-muted hover:bg-cream hover:text-navy disabled:invisible" aria-label="Flytta bakåt" title="Flytta bakåt">
                          <ArrowLeft size={15} />
                        </button>
                        <button type="button" disabled={i === images.length - 1} onClick={() => start(() => moveAlbumImage(img.id, "down"))} className="rounded p-1.5 text-muted hover:bg-cream hover:text-navy disabled:invisible" aria-label="Flytta framåt" title="Flytta framåt">
                          <ArrowRight size={15} />
                        </button>
                      </div>
                      <div className="flex">
                        {!isCover && (
                          <button type="button" onClick={() => start(() => setAlbumCover(albumId, img.thumb))} className="rounded p-1.5 text-muted hover:bg-cream hover:text-gold-ink" aria-label="Använd som omslag" title="Använd som omslag">
                            <Star size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Ta bort bilden? Det går inte att ångra.")) start(() => deleteAlbumImage(img.id));
                          }}
                          className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-700"
                          aria-label="Ta bort bilden"
                          title="Ta bort bilden"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
