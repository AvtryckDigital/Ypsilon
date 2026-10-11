import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { getPage, type Photo } from "@/lib/data";
import { srcSet } from "@/lib/images";
import { Container, Markdown, PageHeader } from "./ui";

/** En redigerbar sida: rubrik och ingress överst, sedan bild och brödtext. */
export default async function ContentPage({
  slug,
  eyebrow,
  aside,
  photos,
  children,
}: {
  slug: string;
  eyebrow?: string;
  aside?: ReactNode;
  /** Bildremsa under texten med länkar till albumen. */
  photos?: Photo[];
  children?: ReactNode;
}) {
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={page.title} intro={page.intro} image={page.image} />
      <Container className="py-14 sm:py-20">
        <div className={aside ? "grid gap-12 lg:grid-cols-[1fr_20rem]" : ""}>
          <div className={aside ? "" : "mx-auto max-w-3xl"}>
            <Markdown className="text-[1.08rem]">{page.body}</Markdown>
            {children}
            {photos && photos.length >= 3 && (
              <div className="mt-14 grid grid-cols-3 gap-2 sm:gap-3">
                {photos.slice(0, 3).map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/galleri/${p.album_slug}`}
                    className={`oxford-frame group relative block overflow-hidden rounded-sm border border-[#ded3c2] bg-white p-1 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c5a059]/70 hover:shadow-md ${i === 1 ? "translate-y-6" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.medium ?? p.thumb} srcSet={srcSet(p)} sizes="(min-width: 1024px) 22vw, 33vw" alt="" loading="lazy" className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-105" />
                    <span className="absolute inset-x-1 bottom-1 bg-gradient-to-t from-[#0d0f14]/90 via-[#0d0f14]/50 to-transparent p-3 pt-10 font-serif text-xs font-semibold uppercase tracking-wider text-[#dfbe76]">
                      {p.album_title}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {aside && <aside className="space-y-6">{aside}</aside>}
        </div>
      </Container>
    </>
  );
}

export async function pageMetadata(slug: string) {
  const page = await getPage(slug);
  return { title: page?.title ?? "Ypsilon", description: page?.intro ?? undefined };
}
