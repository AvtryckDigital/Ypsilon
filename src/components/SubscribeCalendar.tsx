"use client";

import { useState } from "react";

// Länk för att prenumerera på kalendariet i telefonens eller datorns kalender.
export default function SubscribeCalendar({ onDark = false }: { onDark?: boolean }) {
  const [copied, setCopied] = useState(false);
  const feedUrl = () => `${window.location.origin}/kalendarium.ics`;
  const link = onDark
    ? "border-[#c5a059]/60 text-[#dfbe76] hover:border-[#c5a059] hover:text-[#fbf8f2]"
    : "border-[#8c6b2d]/50 text-warm hover:border-[#8c6b2d]";
  const muted = onDark ? "text-[#d6cdbd] hover:text-[#fbf8f2]" : "text-warm-muted hover:text-warm";

  return (
    <p className="mt-8 flex flex-wrap items-baseline gap-x-5 gap-y-2 font-serif text-[0.95rem]">
      <a
        href="/kalendarium.ics"
        onClick={(e) => {
          e.preventDefault();
          window.location.href = feedUrl().replace(/^https?:/, "webcal:");
        }}
        className={`border-b pb-0.5 font-medium transition-colors ${link}`}
      >
        Prenumerera på kalendern
      </a>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(feedUrl());
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }}
        className={`transition-colors ${muted}`}
      >
        {copied ? "Länken är kopierad" : "eller kopiera länken"}
      </button>
    </p>
  );
}
