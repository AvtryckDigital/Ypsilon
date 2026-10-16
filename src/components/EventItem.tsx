import Link from "next/link";
import { Clock, ExternalLink, MapPin } from "lucide-react";
import { dayOfMonth, formatDate, formatTime, monthShort, parseLocal, weekday } from "@/lib/format";
import type { YEvent } from "@/lib/types";

export function timeRange(e: YEvent) {
  const start = formatTime(e.starts_at);
  const endTime = formatTime(e.ends_at);
  if (!e.ends_at) return start;

  const s = parseLocal(e.starts_at);
  const endP = parseLocal(e.ends_at);

  let isOvernightOrSameDay = false;
  if (s && endP) {
    const startMs = Date.UTC(s.y, s.m - 1, s.d, s.hh ?? 0, s.mm ?? 0);
    const endMs = Date.UTC(endP.y, endP.m - 1, endP.d, endP.hh ?? 0, endP.mm ?? 0);
    const diffHours = (endMs - startMs) / (1000 * 60 * 60);
    // Samma dag eller överskrider dygnet (t.ex. fest/gasque som slutar natten/morgonen därpå, upp till 28 timmar)
    isOvernightOrSameDay = (s.y === endP.y && s.m === endP.m && s.d === endP.d) || (diffHours > 0 && diffHours <= 28);
  }

  const end = isOvernightOrSameDay && endTime
    ? endTime
    : `${formatDate(e.ends_at, false)} ${endTime}`.trim();

  if (start && end) return `${start}–${end}`;
  if (!start && end) return `till ${end}`;
  return start;
}

export function KindBadge({ kind }: { kind: YEvent["kind"] }) {
  if (kind === "extern") {
    return (
      <span className="rounded-sm border border-[#ded3c2] bg-[#f5eedd]/60 px-2.5 py-0.5 font-serif text-[0.7rem] font-medium tracking-wide text-warm-muted">
        Inte arrangerat av Ypsilon
      </span>
    );
  }
  return null;
}

export default function EventItem({
  event,
  compact = false,
  banner: bannerProp = false,
}: {
  event: YEvent;
  compact?: boolean;
  /** Visar affischen överst som ett bannerkort (t.ex. på startsidan). */
  banner?: boolean;
}) {
  const time = timeRange(event);
  const isImportant = event.kind === "yra";
  const isExtern = event.kind === "extern";
  const isBannerCard = bannerProp && Boolean(event.poster);
  const href = `/kalendarium/${event.id}`;

  return (
    <article
      className={`oxford-frame group/card flex rounded-sm border bg-[#fbf9f5] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isBannerCard ? "flex-col p-4 sm:p-5" : "flex-row items-center gap-4 p-4 sm:gap-5 sm:p-5"
      } ${isImportant ? "border-[#c5a059]/70 ring-1 ring-[#c5a059]/20" : "border-[#ded3c2] hover:border-[#c5a059]/50"}`}
    >
      {isBannerCard && (
        <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-sm border border-[#ded3c2] bg-[#0d0f14]">
          {/* Hela affischen syns, med en suddig kopia som fyller ytan bakom */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.poster!}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.poster!}
            alt={`Affisch för ${event.title}`}
            loading="lazy"
            className="relative h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover/card:scale-[1.03]"
          />
        </div>
      )}

      <div className={`flex min-w-0 flex-1 ${isBannerCard ? "gap-4 sm:gap-5" : "items-center gap-4 sm:gap-5"}`}>
        <div
          className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-sm py-2 text-center sm:w-[4.5rem] ${
            isImportant ? "border border-[#c5a059]/40 bg-[#0d0f14] text-[#dfbe76] shadow-sm" : "border border-[#ded3c2] bg-[#f4eee1] text-warm"
          }`}
          aria-hidden
        >
          <span className="font-display text-3xl font-semibold leading-none">{dayOfMonth(event.starts_at)}</span>
          <span className={`mt-1 font-serif text-xs font-semibold uppercase tracking-[0.22em] ${isImportant ? "text-[#dfbe76]" : "text-[#8c6b2d]"}`}>
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
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href={href}
              className="relative z-10 inline-flex items-center gap-1.5 font-serif text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b2d] hover:text-warm"
            >
              Läs mer <span aria-hidden>→</span>
            </Link>
            {event.link && (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 inline-flex items-center gap-1.5 font-serif text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6b2d] hover:text-warm"
              >
                Facebook <ExternalLink size={14} aria-hidden />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Landskapsbild inuti kortet till höger, länkar till evenemangssidan */}
      {event.poster && !compact && !isBannerCard && (
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="relative z-10 mr-1 block w-24 shrink-0 self-center overflow-hidden rounded-sm border border-[#ded3c2] bg-white p-1 shadow-sm transition hover:border-[#c5a059]/70 hover:shadow-md sm:mr-3 sm:w-36 md:w-40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.poster}
            alt={`Affisch för ${event.title}`}
            loading="lazy"
            className="aspect-[16/9] w-full rounded-xs object-cover"
          />
        </Link>
      )}
    </article>
  );
}
