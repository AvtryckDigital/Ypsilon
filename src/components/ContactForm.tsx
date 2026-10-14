"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

const SUBJECTS = ["Allmän fråga", "Bli medlem", "Ekonomi och betalning", "Gammal medlem", "Samarbete", "Annat"];

const field =
  "w-full rounded-sm border border-[#ded3c2] bg-[#fbf9f5] px-4 py-3 text-[1rem] text-warm outline-none transition focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/30";

// Skickar meddelandet via Web3Forms, som vidarebefordrar det till föreningens e-post.
export default function ContactForm({ accessKey, fallbackEmail }: { accessKey?: string; fallbackEmail?: string }) {
  const key = accessKey || process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!key) return;
    setStatus("sending");
    const data = new FormData(e.currentTarget);
    data.append("access_key", key);
    data.append("subject", `Ypsilon: ${data.get("amne") || "Nytt meddelande"} från ${data.get("namn")}`);
    data.append("from_name", "Ypsilons hemsida");
    try {
      const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body: data });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean };
      setStatus(res.ok && json.success !== false ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="oxford-frame rounded-sm border border-[#c5a059]/50 bg-[#fbf9f5] p-8 text-center shadow-sm" role="status">
        <CheckCircle2 size={40} className="mx-auto text-[#8c6b2d]" aria-hidden />
        <p className="mt-3 font-display text-3xl text-warm">Tack för ditt meddelande!</p>
        <p className="mt-2 font-serif text-warm-muted italic">Vi svarar så snart vi kan, oftast inom några dagar.</p>
        <button type="button" onClick={() => setStatus("idle")} className="mt-5 font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6b2d] hover:text-warm">
          Skicka ett till meddelande →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {!key && (
        <p className="rounded-sm border border-[#c5a059]/40 bg-[#fbf9f5] px-4 py-3 text-[0.95rem]">
          Formuläret är inte aktiverat ännu.
          {fallbackEmail && (
            <> Skicka gärna ett mejl till <a className="font-semibold text-[#8c6b2d] underline" href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a> så länge.</>
          )}
        </p>
      )}
      {/* Fälla för spamrobotar. Riktiga besökare ser inte fältet. */}
      <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block font-serif text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b2d]">Namn</span>
          <input name="namn" required autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-serif text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b2d]">E-post</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block font-serif text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b2d]">Vad gäller det?</span>
        <select name="amne" className={field} defaultValue={SUBJECTS[0]}>
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block font-serif text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b2d]">Meddelande</span>
        <textarea name="meddelande" required rows={6} className={`${field} resize-y`} />
      </label>

      {status === "error" && (
        <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-[0.95rem] text-red-800" role="alert">
          Meddelandet kunde inte skickas. Försök igen om en stund
          {fallbackEmail ? <>, eller mejla <a className="underline" href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a></> : null}.
        </p>
      )}

      <button
        type="submit"
        disabled={!key || status === "sending"}
        className="inline-flex items-center gap-2 rounded-full border border-[#c5a059]/40 bg-[#0d0f14] px-8 py-3.5 font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#dfbe76] shadow-sm transition hover:border-[#c5a059] hover:bg-[#131620] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "sending" && <Loader2 size={16} className="animate-spin text-[#dfbe76]" aria-hidden />}
        {status === "sending" ? "Skickar…" : "Skicka meddelande"}
      </button>
    </form>
  );
}
