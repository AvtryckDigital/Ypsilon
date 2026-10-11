import { Mail } from "lucide-react";
import { Container, EmptyState, Markdown, PageHeader, SectionTitle } from "@/components/ui";
import { getBoard, getPage, getSettings } from "@/lib/data";

export async function generateMetadata() {
  const page = await getPage("styrelsen");
  return { title: page?.title ?? "Styrelsen", description: page?.intro ?? undefined };
}

export default async function BoardPage() {
  const [page, board, s] = await Promise.all([getPage("styrelsen"), getBoard(), getSettings()]);

  return (
    <>
      <PageHeader eyebrow="Föreningens ledning" title={page?.title ?? "Styrelsen"} intro={page?.intro} image={page?.image} />
      <Container className="py-14 sm:py-20">
        {page?.body && (
          <div className="mx-auto mb-12 max-w-3xl">
            <Markdown>{page.body}</Markdown>
          </div>
        )}

        {/* Gruppbilden visas inramad som övriga bilder på sajten, så att sidhuvudet ser ut som på andra undersidor. */}
        {s.board_photo && (
          <figure className="mx-auto mb-12 max-w-4xl sm:mb-16">
            <div className="oxford-frame overflow-hidden rounded-sm border border-[#ded3c2] bg-white p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.board_photo} alt={s.board_photo_caption || "Gruppbild på styrelsen"} className="w-full" />
            </div>
            {s.board_photo_caption && (
              <figcaption className="mt-3 text-center font-serif text-sm italic text-warm-muted">{s.board_photo_caption}</figcaption>
            )}
          </figure>
        )}

        <SectionTitle title={s.board_heading || "Styrelsemedlemmar"} />

        {board.length === 0 ? (
          <EmptyState title="Styrelsen presenteras snart" />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {board.map((m) => (
              <li
                key={m.id}
                className="oxford-frame group relative flex flex-col justify-between overflow-hidden rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c5a059]/70 hover:shadow-md"
              >
                <div>
                  {m.image ? (
                    <div className="mb-5 aspect-[4/5] w-full overflow-hidden rounded-sm border border-[#ded3c2]/80 bg-white p-1 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.image} alt={m.name} className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105" />
                    </div>
                  ) : null}
                  <div className="flex items-start justify-between gap-3">
                    {m.role_description ? (
                      <span className="font-serif text-xs font-semibold uppercase tracking-[0.22em] text-[#8c6b2d]">
                        {m.role_description}
                      </span>
                    ) : <span />}
                    {m.email && (
                      <a
                        href={`mailto:${m.email}`}
                        className="text-warm-muted transition-colors hover:text-[#8c6b2d]"
                        title={`Maila ${m.role}`}
                      >
                        <Mail size={16} aria-hidden />
                      </a>
                    )}
                  </div>
                  <h3 className="mt-1.5 font-display text-2xl text-warm transition-colors group-hover:text-[#8c6b2d]">
                    {m.role}
                  </h3>
                  <p className="mt-1 font-serif text-[1.05rem] italic text-warm/90">{m.name}</p>
                </div>
                {m.email && (
                  <div className="mt-5 border-t border-[#ded3c2]/70 pt-3">
                    <a
                      href={`mailto:${m.email}`}
                      className="font-serif text-xs text-warm-muted underline decoration-warm/25 underline-offset-4 hover:text-[#8c6b2d]"
                    >
                      {m.email}
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
