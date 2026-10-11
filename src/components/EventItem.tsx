import Link from "next/link";
import { Clock, ExternalLink, MapPin } from "lucide-react";
import { dayOfMonth, formatDate, formatTime, monthShort, weekday } from "@/lib/format";
import type { YEvent } from "@/lib/types";

export function timeRange(e: YEvent) {
  const start = formatTime(e.starts_at);
  const sameDay = e.ends_at?.slice(0, 10) === e.starts_at.slice(0, 10);
  const end = e.ends_at ? (sameDay ? formatTime(e.ends_at) : `${formatDate(e.ends_at, false)} ${formatTime(e.ends_at)}`.trim()) : "";
  if (start && end) return `${start}–${end}`;
  if (!start && end) return `till ${end}`;
  return start;
}

export function KindBadge({ kind }: { kind: YEvent["kind"] }) {
  if (kind === "yra") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-[#c5a059]/50 bg-[#0d0f14] px-2.5 py-0.5 font-serif text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#dfbe76]">
        Yra
      </span>
    );
  }
  if (kind === "extern") {
    return <span className="rounded-sm border border-[#ded3c2] bg-[#f5eedd]/60 px-2.5 py-0.5 font-serif text-[0.7rem] font-medium tracking-wide text-warm-muted">Inte arrangerat av Ypsilon</span>;
  }
  return null;
}

export default function EventItem({
  event,
  compact = false,
  banner: showBanner = false,
}: {
  event: YEvent;
  compact?: boolean;
  /** Affischen överst på kortet, som länk till evenemanget i kalendariet (startsidan). */
  banner?: boolean;
}) {
  const time = timeRange(event);
  const isYra = event.kind === "yra";
  const isExtern = event.kind === "extern";
  const banner = showBanner && event.poster;
  const href = `/kalendarium/${event.id}`;
  // Långa beskrivningar kortas av i listan och läses i sin helhet på evenemangets sida
  const longDescription = (event.description?.length ?? 0) > 280 || (event.description?.split("\n").length ?? 0) > 5;

  return (
    <article
      className={`oxford-frame group/card flex gap-4 rounded-sm border bg-[#fbf9f5] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:gap-5 sm:p-5 ${
        banner ? "flex-col" : ""
      } ${isYra ? "border-[#c5a059]/70 ring-1 ring-[#c5a059]/20" : "border-[#ded3c2] hover:border-[#c5a059]/50"}`}
    >
      {banner && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-[#ded3c2] bg-[#0d0f14]">
          {/* Hela affischen syns, med en suddig kopia som fyller ytan bakom */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.poster!} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.poster!}
            alt={`Affisch för ${event.title}`}
            loading="lazy"
            className="relative h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover/card:scale-[1.03]"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
        <div
          className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-sm py-2 text-center sm:w-[4.5rem] ${
            isYra ? "border border-[#c5a059]/40 bg-[#0d0f14] text-[#dfbe76] shadow-sm" : "border border-[#ded3c2] bg-[#f4eee1] text-warm"
          }`}
          aria-hidden
        >
          <span className="font-display text-3xl font-semibold leading-none">{dayOfMonth(event.starts_at)}</span>
          <span className={`mt-1 font-serif text-xs font-semibold uppercase tracking-[0.22em] ${isYra ? "text-[#dfbe76]" : "text-[#8c6b2d]"}`}>
            {monthShort(event.starts_at)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className={`font-display text-2xl leading-tight ${isExtern ? "italic text-warm/80" : "text-warm"}`}>
              {/* Hela kortet är klickbart via länkens ::after; övriga länkar ligger ovanpå med z-10 */}
              <Link
                href={href}
                className="decoration-[#c5a059]/60 underline-offset-4 after:absolute after:inset-0 after:content-[''] group-hover/card:underline"
              >
                {event.title}
              </Link>
            </h3>
            <KindBadge kind={event.kind} />
          </div>
          <p className="sr-only">{weekday(event.starts_at)} {formatDate(event.starts_at)}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-[0.95rem] text-warm-muted">
            <span className="capitalize">{weekday(event.starts_at)}</span>
            {time && (
              <span className="inline-flex items-center gap-1.5"><Clock size={15} aria-hidden /> {time}</span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-1.5"><MapPin size={15} aria-hidden /> {event.location}</span>
            )}
          </div>
          {!compact && event.description && (
            <p className={`mt-3 whitespace-pre-line text-[0.98rem] leading-relaxed text-warm/90 ${longDescription ? "line-clamp-4" : ""}`}>
              {event.description}
            </p>
          )}
          {!compact && longDescription && (
            <Link
              href={href}
              className="relative z-10 mt-3 mr-5 inline-flex items-center gap-1.5 font-serif text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b2d] hover:text-warm"
            >
              Läs mer <span aria-hidden>→</span>
            </Link>
          )}
          {!compact && event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 mt-3 inline-flex items-center gap-1.5 font-serif text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b2d] hover:text-warm"
            >
              Mer information <ExternalLink size={14} aria-hidden />
            </a>
          )}
        </div>
      </div>

      {/* Affischen från föreningens inlägg, om den finns. Öppnas i full storlek. */}
      {event.poster && !compact && !banner && (
        <a
          href={event.poster}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 block w-16 shrink-0 self-start overflow-hidden rounded-sm border border-[#ded3c2] bg-white p-1 shadow-sm transition hover:-rotate-1 hover:shadow-md sm:w-32"
          title={`Affisch för ${event.title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.poster} alt={`Affisch för ${event.title}`} loading="lazy" className="aspect-[4/5] w-full object-cover" />
        </a>
      )}
    </article>
  );
}
