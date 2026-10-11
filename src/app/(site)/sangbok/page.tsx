import SongSearch from "@/components/SongSearch";
import { Container, EmptyState, PageHeader } from "@/components/ui";
import { getPage, getSongs } from "@/lib/data";

export async function generateMetadata() {
  const page = await getPage("sangbok");
  return { title: page?.title ?? "Sångbok", description: page?.intro ?? undefined };
}

export default async function SongbookPage() {
  const [page, songs] = await Promise.all([getPage("sangbok"), getSongs()]);

  return (
    <>
      <PageHeader
        eyebrow="Sjung med"
        title={page?.title ?? "Sångbok"}
        intro={page?.intro}
        image={page?.image}
      />
      <Container className="max-w-3xl py-10 sm:py-14">
        {songs.length === 0 ? (
          <EmptyState title="Sångboken fylls på">
            Sångerna läggs in av styrelsen. Titta gärna in igen snart!
          </EmptyState>
        ) : (
          <SongSearch
            songs={songs.map(({ slug, title, number, category, melody, lyrics }) => ({
              slug, title, number, category, melody, lyrics,
            }))}
          />
        )}
      </Container>
    </>
  );
}
