import Link from "next/link";
import { Container, EmptyState, Markdown, PageHeader } from "@/components/ui";
import { getHonoraryMembers, getPage } from "@/lib/data";

export async function generateMetadata() {
  const page = await getPage("hedersypsor");
  return { title: page?.title ?? "HedersYpsor", description: page?.intro ?? undefined };
}

export default async function HonoraryPage() {
  const [page, members] = await Promise.all([getPage("hedersypsor"), getHonoraryMembers()]);

  return (
    <>
      <PageHeader eyebrow="Hedersmedlemmar" title={page?.title ?? "HedersYpsor"} intro={page?.intro} image={page?.image} />
      <Container className="max-w-4xl py-14 sm:py-20">
        <Markdown className="mx-auto mb-12">{page?.body}</Markdown>
        {members.length === 0 ? (
          <EmptyState title="Inga HedersYpsor tillagda" />
        ) : (
          <ol className="relative space-y-6 border-l border-[#c5a059]/40 pl-8 sm:ml-6">
            {members.map((m) => (
              <li key={m.id} className="relative">
                <span className="absolute -left-[2.35rem] top-6 h-3 w-3 rounded-full border-2 border-[#c5a059] bg-[#0d0f14]" aria-hidden />
                <div className="oxford-frame flex gap-5 rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c5a059]/70 hover:shadow-md">
                  {m.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.image} alt="" className="h-20 w-20 shrink-0 rounded-full border-2 border-white object-cover ring-2 ring-[#c5a059]/40 shadow-sm" />
                  )}
                  <div>
                    <p className="font-serif text-xs font-semibold uppercase tracking-[0.22em] text-[#8c6b2d]">Utnämnd {m.year}</p>
                    <p className="font-display text-2xl text-warm">{m.name}</p>
                    {m.motivation && <p className="mt-1 font-serif text-[0.98rem] italic leading-relaxed text-warm-muted">{m.motivation}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-14 text-center">
          <Link href="/overypsor" className="font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6b2d] hover:text-warm">Alla ÖverYpsor sedan 1962 →</Link>
        </p>
      </Container>
    </>
  );
}
