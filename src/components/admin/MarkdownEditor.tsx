"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bold, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Quote } from "lucide-react";
import { resizeImage, upload } from "@/lib/admin/resize";

// Enkel textredigerare. Texten sparas som Markdown, men knapparna gör att man
// inte behöver kunna formatet: markera text och tryck på en knapp.
export default function MarkdownEditor({
  name,
  defaultValue,
  rows = 14,
  invalid,
  describedBy,
  id,
}: {
  name: string;
  defaultValue?: string | null;
  rows?: number;
  invalid?: boolean;
  describedBy?: string;
  id?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function apply(fn: (selected: string) => { text: string; select?: [number, number] }, lineMode = false) {
    const el = area.current;
    if (!el) return;
    let start = el.selectionStart;
    let end = el.selectionEnd;
    if (lineMode) {
      start = value.lastIndexOf("\n", start - 1) + 1;
      const nl = value.indexOf("\n", end);
      end = nl === -1 ? value.length : nl;
    }
    const selected = value.slice(start, end);
    const { text, select } = fn(selected);
    const next = value.slice(0, start) + text + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      if (select) el.setSelectionRange(start + select[0], start + select[1]);
      else el.setSelectionRange(start + text.length, start + text.length);
    });
  }

  const wrap = (mark: string, placeholder: string) =>
    apply((s) => {
      const inner = s || placeholder;
      return { text: `${mark}${inner}${mark}`, select: [mark.length, mark.length + inner.length] };
    });

  const prefixLines = (prefix: (i: number) => string, placeholder: string) =>
    apply((s) => {
      const lines = (s || placeholder).split("\n");
      return { text: lines.map((l, i) => `${prefix(i)}${l.replace(/^(#{1,6} |> |- |\d+\. )/, "")}`).join("\n") };
    }, true);

  async function insertImages(list: FileList | File[] | null | undefined) {
    const files = [...(list ?? [])].filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    const urls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setUploading(`Laddar upp bild ${i + 1} av ${files.length}…`);
        // 1400 px räcker för textspalten, även på skärmar med hög upplösning.
        const r = await resizeImage(files[i]);
        const res = await upload("bilder", files[i].name.replace(/\.[^.]+$/, ""), { file: r.medium, thumb: r.thumb });
        urls.push(res.src);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Bilden kunde inte laddas upp.");
    } finally {
      setUploading(null);
      if (fileInput.current) fileInput.current.value = "";
    }
    if (urls.length) {
      setTab("write");
      apply(() => ({ text: `\n\n${urls.map((u) => `![](${u})`).join("\n")}\n\n` }));
    }
  }

  type ToolId = "h2" | "bold" | "italic" | "ul" | "ol" | "quote" | "link";
  const tools: { id: ToolId; label: string; icon: typeof Bold }[] = [
    { id: "h2", label: "Mellanrubrik", icon: Heading2 },
    { id: "bold", label: "Fetstil", icon: Bold },
    { id: "italic", label: "Kursiv", icon: Italic },
    { id: "ul", label: "Punktlista", icon: List },
    { id: "ol", label: "Numrerad lista", icon: ListOrdered },
    { id: "quote", label: "Citat", icon: Quote },
    { id: "link", label: "Länk", icon: Link2 },
  ];

  function runTool(id: ToolId) {
    switch (id) {
      case "h2": return prefixLines(() => "## ", "Rubrik");
      case "bold": return wrap("**", "fet text");
      case "italic": return wrap("*", "kursiv text");
      case "ul": return prefixLines(() => "- ", "Punkt");
      case "ol": return prefixLines((i) => `${i + 1}. `, "Punkt");
      case "quote": return prefixLines(() => "> ", "Citat");
      case "link": {
        const url = prompt("Vilken adress ska länken gå till?", "https://");
        if (!url) return;
        return apply((s) => {
          const t = s || "länktext";
          return { text: `[${t}](${url})`, select: [1, 1 + t.length] };
        });
      }
    }
  }

  return (
    <div className={`overflow-hidden rounded-md border bg-white ${invalid ? "border-red-400" : "border-line"} focus-within:border-royal focus-within:ring-2 focus-within:ring-royal/15`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-0.5" role="toolbar" aria-label="Formatering">
          {tools.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => runTool(id)}
              disabled={tab === "preview"}
              title={label}
              aria-label={label}
              className="rounded p-2 text-ink/75 hover:bg-cream hover:text-navy disabled:opacity-40"
            >
              <Icon size={17} />
            </button>
          ))}
          <span className="mx-1 h-6 w-px bg-line" aria-hidden />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={!!uploading}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold text-navy hover:bg-cream disabled:opacity-50"
          >
            {uploading ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <ImagePlus size={17} aria-hidden />}
            Lägg till bilder
          </button>
          <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => insertImages(e.target.files)} />
        </div>
        <div className="flex rounded-md bg-white p-0.5 text-sm font-semibold ring-1 ring-line">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`rounded px-3 py-1 ${tab === t ? "bg-navy text-white" : "text-muted hover:text-navy"}`}
            >
              {t === "write" ? "Skriv" : "Förhandsvisa"}
            </button>
          ))}
        </div>
      </div>

      <textarea
        ref={area}
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={rows}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) e.preventDefault();
        }}
        onDrop={(e) => {
          if (e.dataTransfer.files.length === 0) return;
          e.preventDefault();
          insertImages(e.dataTransfer.files);
        }}
        onPaste={(e) => {
          const images = [...e.clipboardData.files].filter((f) => f.type.startsWith("image/"));
          if (images.length === 0) return;
          e.preventDefault();
          insertImages(images);
        }}
        className={`block w-full resize-y px-4 py-3 text-[1rem] leading-relaxed outline-none ${tab === "preview" ? "hidden" : ""}`}
      />
      {tab === "preview" && (
        <div className="min-h-48 px-5 py-4">
          {value.trim() ? (
            <div className="prose-y">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-muted">Inget att visa ännu.</p>
          )}
        </div>
      )}
      <p className="border-t border-line bg-paper px-4 py-2 text-xs text-muted" aria-live="polite">
        {uploading ?? "Tips: dra in eller klistra in bilder direkt i texten. Flera bilder samtidigt visas sida vid sida. Lämna en tom rad mellan stycken."}
      </p>
    </div>
  );
}
