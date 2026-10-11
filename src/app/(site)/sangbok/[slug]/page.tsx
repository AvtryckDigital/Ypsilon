import { notFound } from "next/navigation";
import { BackLink, Container, Ornament, PageHeader, SidebarCard } from "@/components/ui";
import { getSong } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/sangbok/[slug]">) {
  const { slug } = await params;
  const song = await getSong(slug);
  return { title: song ? song.title : "Sången finns inte" };
}

export default async function SongPage({ params }: PageProps<"/sangbok/[slug]">) {
  const { slug } = await params;
  const song = await getSong(slug);
  if (!song) notFound();

  const intro = [
    song.melody ? `Melodi: ${song.melody}` : null,
    song.category,
  ].filter(Boolean).join(" · ");

  return (
    <article>
      <PageHeader
        eyebrow={song.number != null ? `Nr ${song.number}` : "Sångbok"}
        title={song.title}
        intro={intro}
      />
      <Container className="max-w-2xl py-12 sm:py-16">
        <BackLink href="/sangbok">Sångboken</BackLink>
        <Ornament className="my-8 justify-center" />
        <div className="lyrics text-center text-warm">{song.lyrics}</div>
        {song.notes && (
          <SidebarCard title="Kommentar" className="mt-12 text-left">
            <p className="whitespace-pre-line text-warm-muted">{song.notes}</p>
          </SidebarCard>
        )}
      </Container>
    </article>
  );
}
