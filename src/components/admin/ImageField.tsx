"use client";

import { useRef, useState } from "react";
import { FileText, ImagePlus, Images, Loader2, Trash2, Upload } from "lucide-react";
import { resizeImage, upload } from "@/lib/admin/resize";
import MediaPicker from "./MediaPicker";

// Bild- eller filfält: laddar upp direkt när en fil väljs och sparar adressen i ett dolt fält.
// Bilder kan också väljas bland dem som redan finns, i biblioteket eller i galleriet.
export default function ImageField({
  name,
  defaultValue,
  kind = "image",
  invalid,
  describedBy,
}: {
  name: string;
  defaultValue?: string | null;
  kind?: "image" | "file";
  invalid?: boolean;
  describedBy?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [picking, setPicking] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const base = file.name.replace(/\.[^.]+$/, "");
      if (kind === "image") {
        if (!file.type.startsWith("image/")) throw new Error("Välj en bildfil.");
        // Största versionen räcker även för bilder i full skärmbredd.
        const r = await resizeImage(file);
        const res = await upload("bilder", base, { file: r.large, medium: r.medium, thumb: r.thumb }, { width: r.width, height: r.height });
        setValue(res.src);
      } else {
        if (file.size > 40 * 1024 * 1024) throw new Error("Filen är större än 40 MB.");
        const res = await upload("filer", base, { file });
        setValue(res.src);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uppladdningen misslyckades.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const accept = kind === "image" ? "image/*" : "application/pdf,image/*";

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      {value ? (
        <div className="flex flex-wrap items-center gap-4 rounded-md border border-line bg-white p-3">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-24 w-32 rounded object-cover" />
          ) : (
            <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-royal underline">
              <FileText size={20} aria-hidden /> Öppna nuvarande fil
            </a>
          )}
          <div className="flex flex-wrap gap-2">
            {kind === "image" && (
              <button type="button" onClick={() => setPicking(true)} disabled={busy} className="admin-btn-secondary">
                <Images size={16} /> Välj en annan
              </button>
            )}
            <button type="button" onClick={() => input.current?.click()} disabled={busy} className="admin-btn-secondary">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {kind === "image" ? "Ladda upp ny" : "Byt"}
            </button>
            <button type="button" onClick={() => setValue("")} disabled={busy} className="admin-btn-secondary text-red-700">
              <Trash2 size={16} /> Ta bort
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handle(e.dataTransfer.files[0]);
          }}
          disabled={busy}
          aria-describedby={describedBy}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-[0.95rem] transition-colors ${
            dragOver ? "border-royal bg-royal/5" : invalid ? "border-red-400" : "border-line bg-white hover:border-navy/40"
          }`}
        >
          {busy ? <Loader2 size={24} className="animate-spin text-navy" /> : <ImagePlus size={24} className="text-navy" />}
          <span className="font-semibold text-navy">
            {busy ? "Laddar upp…" : kind === "image" ? "Välj bild eller dra hit den" : "Välj fil eller dra hit den"}
          </span>
          {!busy && <span className="text-sm text-muted">{kind === "image" ? "JPG, PNG eller WebP" : "PDF eller bild, högst 40 MB"}</span>}
        </button>
      )}
      {kind === "image" && !value && (
        <button type="button" onClick={() => setPicking(true)} disabled={busy} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-royal hover:text-navy">
          <Images size={16} aria-hidden /> Välj bland befintliga bilder
        </button>
      )}
      {picking && (
        <MediaPicker
          current={value}
          onClose={() => setPicking(false)}
          onSelect={(src) => {
            setValue(src);
            setError(null);
            setPicking(false);
          }}
        />
      )}
      <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
      {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}
