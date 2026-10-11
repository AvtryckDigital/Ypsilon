"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

const MESSAGES: Record<string, string> = {
  sparat: "Ändringarna är sparade.",
  borttagen: "Borttaget.",
};

// Visar en kort bekräftelse efter att något sparats och tar sedan bort ?sparat=1 ur adressen.
export default function Flash() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = Object.keys(MESSAGES).find((k) => params.has(k));

  const dismiss = useCallback(() => {
    if (!key) return;
    const next = new URLSearchParams(params);
    next.delete(key);
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [key, params, pathname, router]);

  useEffect(() => {
    if (!key) return;
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
  }, [key, dismiss]);

  if (!key) return null;
  return (
    <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg bg-navy px-5 py-3.5 text-white shadow-xl shadow-navy/20">
      <CheckCircle2 size={20} className="text-gold" aria-hidden />
      <span className="font-medium">{MESSAGES[key]}</span>
      <button type="button" onClick={dismiss} aria-label="Stäng" className="ml-2 rounded p-1 text-white/70 hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
}
