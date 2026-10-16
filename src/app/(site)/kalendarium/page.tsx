import EventItem from "@/components/EventItem";
import SubscribeCalendar from "@/components/SubscribeCalendar";
import { Container, EmptyState, Markdown, PageHeader, SectionTitle } from "@/components/ui";
import { getPage, getPastEvents, getUpcomingEvents } from "@/lib/data";
import { monthName, parseLocal, todayStockholm } from "@/lib/format";
import type { YEvent } from "@/lib/types";

export async function generateMetadata() {
  const page = await getPage("kalendarium");
  return { title: page?.title ?? "Kalendarium", description: page?.intro ?? undefined };
}

function groupByMonth(events: YEvent[]) {
  const groups: { key: string; label: string; events: YEvent[] }[] = [];
  for (const e of events) {
    const p = parseLocal(e.starts_at);
    if (!p) continue;
    const key = `${p.y}-${p.m}`;
    let g = groups.find((x) => x.key === key);
    if (!g) {
      const name = monthName(p.m);
      g = { key, label: `${name[0].toUpperCase()}${name.slice(1)} ${p.y}`, events: [] };
      groups.push(g);
    }
    g.events.push(e);
  }
  return groups;
}

/** Terminen börjar 1 januari (VT) eller 1 augusti (HT). */
function semesterStart() {
  const today = todayStockholm();
  const [y, m] = today.split("-").map(Number);
  return m >= 8 ? `${y}-08-01` : `${y}-01-01`;
}

export default async function CalendarPage() {
  const [page, upcoming, past] = await Promise.all([
    getPage("kalendarium"),
    getUpcomingEvents(),
    getPastEvents(semesterStart()),
  ]);
  const groups = groupByMonth(upcoming);

  return (
    <>
      <PageHeader
        eyebrow="Kommande evenemang"
        title={page?.title ?? "Kalendarium"}
        intro={page?.intro}
        image={page?.image}
      >
        <SubscribeCalendar onDark={true} />
      </PageHeader>

      <Container className="max-w-4xl py-14 sm:py-20">
        <Markdown className="mb-10">{page?.body}</Markdown>


        {groups.length === 0 ? (
          <EmptyState title="Inga planerade evenemang just nu">
            Nya datum läggs upp här så snart de är bestämda.
          </EmptyState>
        ) : (
          <div className="space-y-12">
            {groups.map((g) => (
              <section key={g.key} aria-labelledby={`m-${g.key}`}>
                <SectionTitle id={`m-${g.key}`} title={g.label} className="!mb-6" />
                <div className="space-y-4">
                  {g.events.map((e) => <EventItem key={e.id} event={e} />)}
                </div>
              </section>
            ))}
          </div>
        )}

        {past.length > 0 && (
          <details className="oxford-frame group mt-16 rounded-sm border border-[#ded3c2] bg-[#fbf9f5] shadow-sm">
            <summary className="cursor-pointer list-none px-5 py-4 font-serif text-sm font-semibold uppercase tracking-wider text-warm marker:hidden">
              <span className="mr-2 inline-block transition-transform group-open:rotate-90">›</span>
              Tidigare den här terminen ({past.length})
            </summary>
            <div className="space-y-3 border-t border-[#ded3c2] p-5 opacity-85">
              {past.map((e) => <EventItem key={e.id} event={e} compact />)}
            </div>
          </details>
        )}
      </Container>
    </>
  );
}
