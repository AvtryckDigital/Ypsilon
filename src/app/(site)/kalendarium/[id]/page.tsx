import { notFound } from "next/navigation";
import { CalendarDays, Clock, ExternalLink, MapPin } from "lucide-react";
import { KindBadge, timeRange } from "@/components/EventItem";
import { BackLink, Container, PageHeader } from "@/components/ui";
import { getEvent } from "@/lib/data";
import { formatDate, truncate, weekday } from "@/lib/format";

async function load(params: PageProps<"/kalendarium/[id]">["params"]) {
  const { id } = await params;
  return /^\d+$/.test(id) ? getEvent(Number(id)) : null;
}

export async function generateMetadata({ params }: PageProps<"/kalendarium/[id]">) {
  const event = await load(params);
  if (!event) return { title: "Evenemanget finns inte" };
  const when = `${weekday(event.starts_at)} ${formatDate(event.starts_at)}`;
  return {
    title: event.title,
    description: event.description ? truncate(event.description, 160) : `${when}${event.location ? `, ${event.location}` : ""}`,
    openGraph: event.poster ? { images: [event.poster] } : undefined,
  };
}

export default async function EventPage({ params }: PageProps<"/kalendarium/[id]">) {
  const event = await load(params);
  if (!event) notFound();

  const day = weekday(event.starts_at);
  const date = `${day.charAt(0).toUpperCase()}${day.slice(1)} ${formatDate(event.starts_at)}`;
  const time = timeRange(event);

  return (
    <article>
      <PageHeader eyebrow={date} title={event.title} />

      <Container className="max-w-3xl py-12 sm:py-16">
        <BackLink href="/kalendarium">Hela kalendariet</BackLink>

        {event.poster && (
          <a
            href={event.poster}
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-8 block overflow-hidden rounded-sm border border-[#ded3c2] bg-[#0d0f14] shadow-md transition hover:border-[#c5a059]/60 hover:shadow-lg"
            title="Öppna affischen i full storlek"
          >
            <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-96 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.poster}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.poster}
                alt={`Affisch för ${event.title}`}
                className="relative h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </div>
          </a>
        )}

        <div>
          <dl className="oxford-frame space-y-3 rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-5 text-[1.02rem] text-warm shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <dt className="sr-only">Datum</dt>
              <CalendarDays size={18} className="shrink-0 text-[#8c6b2d]" aria-hidden />
              <dd>{date}</dd>
            </div>
            {time && (
              <div className="flex items-center gap-3">
                <dt className="sr-only">Tid</dt>
                <Clock size={18} className="shrink-0 text-[#8c6b2d]" aria-hidden />
                <dd>{time}</dd>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-3">
                <dt className="sr-only">Plats</dt>
                <MapPin size={18} className="shrink-0 text-[#8c6b2d]" aria-hidden />
                <dd>{event.location}</dd>
              </div>
            )}
            {event.kind === "extern" && (
              <div className="pt-1">
                <KindBadge kind={event.kind} />
              </div>
            )}
          </dl>

          {event.subtitle && (
            <h2 className="mt-8 font-display text-2xl font-semibold leading-snug text-warm sm:text-3xl">
              {event.subtitle}
            </h2>
          )}

          {event.description && (
            <p className={`${event.subtitle ? "mt-4" : "mt-8"} whitespace-pre-line text-[1.1rem] leading-relaxed text-warm/90`}>
              {event.description}
            </p>
          )}

          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-sm border border-[#c5a059]/60 bg-[#0d0f14] px-5 py-3 font-serif text-xs font-semibold uppercase tracking-[0.18em] text-[#dfbe76] shadow-sm transition hover:bg-[#1e2330]"
            >
              Facebook <ExternalLink size={14} aria-hidden />
            </a>
          )}
        </div>
      </Container>
    </article>
  );
}
