import Link from "next/link";
import { Container, EmptyState, Markdown, PageHeader } from "@/components/ui";
import { getFormerChairs, getPage } from "@/lib/data";
import type { FormerChair } from "@/lib/types";

export async function generateMetadata() {
  const page = await getPage("overypsor");
  return { title: page?.title ?? "ÖverYpsor", description: page?.intro ?? undefined };
}

function decade(c: FormerChair) {
  return Math.floor(c.sort_year / 10) * 10;
}

export default async function ChairsPage() {
  const [page, chairs] = await Promise.all([getPage("overypsor"), getFormerChairs()]);

  const decades: { decade: number; items: FormerChair[] }[] = [];
  for (const c of chairs) {
    const d = decade(c);
    const g = decades.find((x) => x.decade === d);
    if (g) g.items.push(c);
    else decades.push({ decade: d, items: [c] });
  }

  return (
    <>
      <PageHeader eyebrow="Ordförande genom tiderna" title={page?.title ?? "ÖverYpsor"} intro={page?.intro} image={page?.image} />
      <Container className="max-w-4xl py-14 sm:py-20">
        <Markdown className="mx-auto mb-12">{page?.body}</Markdown>
        {chairs.length === 0 ? (
          <EmptyState title="Listan är tom" />
        ) : (
          <div className="space-y-12">
            {decades.map((g) => (
              <section key={g.decade} aria-labelledby={`d-${g.decade}`} className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                <h2 id={`d-${g.decade}`} className="font-display text-3xl sm:text-4xl text-warm sm:pt-1">{g.decade}-talet</h2>
                <ol className="divide-y divide-[#ded3c2]/70 rounded-sm border border-[#ded3c2] bg-[#fbf9f5] shadow-sm">
                  {g.items.map((c) => (
                    <li key={c.id} className="flex items-baseline gap-4 px-5 py-3.5 transition-colors hover:bg-white/70">
                      <span className="w-32 shrink-0 font-serif text-sm font-semibold tracking-wider text-[#8c6b2d]">{c.period}</span>
                      <span className="min-w-0">
                        <span className={c.note && c.name === "–" ? "font-serif italic text-warm-muted" : "font-display text-[1.15rem] text-warm"}>
                          {c.name === "–" ? c.note : c.name}
                        </span>
                        {c.note && c.name !== "–" && <span className="block font-serif text-xs italic text-warm-muted">{c.note}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
        <p className="mt-14 text-center">
          <Link href="/hedersypsor" className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6b2d] hover:text-warm">Se även Ypsilons HedersYpsor →</Link>
        </p>
      </Container>
    </>
  );
}
