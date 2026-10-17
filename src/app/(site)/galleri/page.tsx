import Link from "next/link";
import { Images } from "lucide-react";
import { Container, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { getAlbums, getPage } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { srcSet } from "@/lib/images";
import type { Album } from "@/lib/types";

export async function generateMetadata() {
  const page = await getPage("galleri");
  return { title: page?.title ?? "Galleri", description: page?.intro ?? undefined };
}

function yearOf(a: Album) {
  return a.event_date?.slice(0, 4) || (a.year ? String(a.year) : "Okänt år");
}

export default async function GalleryPage() {
  const [page, albums] = await Promise.all([getPage("galleri"), getAlbums()]);

  const years: { year: string; albums: Album[] }[] = [];
  for (const a of albums) {
    const y = yearOf(a);
    const group = years.find((g) => g.year === y);
    if (group) group.albums.push(a);
    else years.push({ year: y, albums: [a] });
  }

  return (
    <>
      <PageHeader
        eyebrow="Minnen"
        title={page?.title ?? "Galleri"}
        intro={page?.intro}
        image={page?.image}
      />
      <Container className="py-12 sm:py-16">
        {albums.length === 0 ? (
          <EmptyState title="Inga album ännu" />
        ) : (
          <>
            {years.length > 3 && (
              <nav aria-label="Hoppa till år" className="mb-10 flex flex-wrap gap-2 text-sm font-semibold">
                {years.map((g) => (
                  <a
                    key={g.year}
                    href={`#ar-${g.year}`}
                    className="rounded-sm border border-[#ded3c2] bg-[#fbf9f5] px-4 py-2 font-serif text-xs font-semibold uppercase tracking-[0.2em] text-warm shadow-sm transition hover:border-[#c5a059] hover:bg-white"
                  >
                    {g.year}
                  </a>
                ))}
              </nav>
            )}
            <div className="space-y-14">
              {years.map((g) => (
                <section key={g.year} id={`ar-${g.year}`} aria-labelledby={`rubrik-${g.year}`} className="scroll-mt-28">
                  <SectionTitle id={`rubrik-${g.year}`} title={g.year} className="!mb-6" />
                  <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {g.albums.map((a) => {
                      const cover = a.cover || a.first_thumb;
                      const isCoverFromImages = !a.cover || a.cover === a.cover_src || a.cover === a.first_thumb;
                      return (
                        <li key={a.id}>
                          <Link
                            href={`/galleri/${a.slug}`}
                            className="oxford-frame group flex flex-col overflow-hidden rounded-sm border border-[#ded3c2] bg-[#fbf9f5] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c5a059]/70 hover:shadow-md"
                          >
                            <div className="relative aspect-[16/10] overflow-hidden border-b border-[#ded3c2] bg-linen">
                              {cover ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={isCoverFromImages ? (a.cover_medium ?? cover) : cover}
                                  srcSet={isCoverFromImages && a.cover_src ? srcSet({ src: a.cover_src, thumb: a.first_thumb ?? cover, medium: a.cover_medium, width: a.cover_width }) : undefined}
                                  sizes="(min-width: 1024px) 33vw, 50vw"
                                  alt=""
                                  loading="lazy"
                                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <div className="grid h-full place-items-center text-antique">
                                  <Images size={36} aria-hidden />
                                </div>
                              )}
                              <span className="absolute right-3 top-3 rounded-sm border border-[#c5a059]/40 bg-[#0d0f14]/90 px-2.5 py-0.5 font-serif text-xs font-semibold tracking-wider text-[#dfbe76] backdrop-blur-sm">
                                {a.image_count ?? 0} bilder
                              </span>
                            </div>
                            <div className="flex flex-1 flex-col justify-between p-5">
                              <div>
                                {a.event_date && (
                                  <span className="block font-serif text-xs font-semibold uppercase tracking-[0.22em] text-[#8c6b2d]">
                                    {formatDate(a.event_date)}
                                  </span>
                                )}
                                <h3 className="mt-1 font-display text-2xl leading-snug text-warm transition-colors group-hover:text-[#8c6b2d]">
                                  {a.title}
                                </h3>
                              </div>
                              {a.photographer && (
                                <span className="mt-3 block font-serif text-xs italic text-warm-muted">
                                  Foto: {a.photographer}
                                </span>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </Container>
    </>
  );
}
