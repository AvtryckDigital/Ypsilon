import { notFound } from "next/navigation";
import Lightbox from "@/components/Lightbox";
import { BackLink, Container, EmptyState, PageHeader } from "@/components/ui";
import { getAlbum } from "@/lib/data";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/galleri/[slug]">) {
  const { slug } = await params;
  const data = await getAlbum(slug);
  if (!data) return { title: "Albumet finns inte" };
  const cover = data.album.cover || data.images[0]?.thumb;
  return {
    title: data.album.title,
    description: data.album.description ?? `${data.images.length} bilder från ${data.album.title}`,
    openGraph: cover ? { images: [cover] } : undefined,
  };
}

export default async function AlbumPage({ params }: PageProps<"/galleri/[slug]">) {
  const { slug } = await params;
  const data = await getAlbum(slug);
  if (!data) notFound();
  const { album, images } = data;

  // Sidhuvudet använder omslaget i full storlek, annars albumets första liggande bild.
  const header =
    images.find((i) => i.thumb === album.cover || i.src === album.cover) ??
    images.find((i) => (i.width ?? 0) > (i.height ?? 0)) ??
    images[0];

  const meta = [
    album.event_date ? formatDate(album.event_date) : album.year ? String(album.year) : null,
    `${images.length} bilder`,
    album.photographer ? `Foto: ${album.photographer}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader eyebrow={meta} title={album.title} intro={album.description} image={header?.src} />
      <Container className="py-10 sm:py-14">
        <BackLink href="/galleri">Alla album</BackLink>
        {images.length === 0 ? (
          <EmptyState title="Albumet är tomt" />
        ) : (
          <Lightbox
            title={album.title}
            images={images.map(({ id, src, thumb, medium, original, caption, width, height }) => ({ id, src, thumb, medium, original, caption, width, height }))}
          />
        )}
      </Container>
    </>
  );
}
