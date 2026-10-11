"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";

import { srcSet } from "@/lib/images";

export type LightboxImage = {
  id: number;
  src: string;
  thumb: string;
  medium: string | null;
  original: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
};

export default function Lightbox({ images, title }: { images: LightboxImage[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(() => setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)), [images.length]);
  const next = useCallback(() => setIndex((i) => (i === null ? i : (i + 1) % images.length)), [images.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, prev, next]);

  // Förladda nästa bild så att bläddringen går snabbt.
  useEffect(() => {
    if (index === null || images.length < 2) return;
    const img = new Image();
    img.src = images[(index + 1) % images.length].src;
  }, [index, images]);

  const current = index !== null ? images[index] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {images.map((img, i) => (
          <li key={img.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group block aspect-square w-full overflow-hidden rounded-sm border border-[#ded3c2] bg-white p-1 shadow-sm transition hover:border-[#c5a059] hover:shadow-md focus-visible:outline-offset-2"
              aria-label={`Visa bild ${i + 1} av ${images.length}${img.caption ? `: ${img.caption}` : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumb} srcSet={srcSet(img)} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" alt={img.caption ?? ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title}, bild ${index! + 1} av ${images.length}`}
          className="fixed inset-0 z-50 flex flex-col bg-[#131620]/98 text-white backdrop-blur-md"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between border-b border-[#c5a059]/20 px-4 py-3 text-sm">
            <span className="font-serif tracking-widest text-[#dfbe76]">{index! + 1} / {images.length}</span>
            <div className="flex items-center gap-1">
              <a href={current.original ?? current.src} download className="rounded-full p-2.5 text-[#d6cdbd] hover:bg-[#c5a059]/20 hover:text-[#dfbe76]" aria-label="Ladda ner bilden i full upplösning" title="Ladda ner i full upplösning">
                <Download size={20} />
              </a>
              <button ref={closeRef} type="button" onClick={close} className="rounded-full p-2.5 text-[#d6cdbd] hover:bg-[#c5a059]/20 hover:text-[#dfbe76]" aria-label="Stäng">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16" onClick={(e) => e.target === e.currentTarget && close()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={current.src} src={current.src} srcSet={srcSet(current)} sizes="100vw" alt={current.caption ?? ""} className="max-h-full max-w-full select-none object-contain" />
            {images.length > 1 && (
              <>
                <button type="button" onClick={prev} aria-label="Föregående bild" className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-[#c5a059]/30 bg-[#131620]/80 p-3 text-[#dfbe76] hover:bg-[#c5a059]/30 sm:block">
                  <ChevronLeft size={28} />
                </button>
                <button type="button" onClick={next} aria-label="Nästa bild" className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-[#c5a059]/30 bg-[#131620]/80 p-3 text-[#dfbe76] hover:bg-[#c5a059]/30 sm:block">
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>

          <div className="min-h-14 border-t border-[#c5a059]/20 px-4 py-4 text-center font-serif text-sm italic text-[#ede2cd]">{current.caption}</div>
        </div>
      )}
    </>
  );
}
