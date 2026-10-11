import ContentPage, { pageMetadata } from "@/components/ContentPage";
import { SidebarCard } from "@/components/ui";
import { getOldestAlbumPhotos } from "@/lib/data";

export const generateMetadata = () => pageMetadata("historia");

export default async function HistoryPage() {
  const photos = await getOldestAlbumPhotos(3);
  return (
    <ContentPage
      slug="historia"
      eyebrow="Sedan 1962"
      photos={photos}
      aside={
        <SidebarCard>
          <p className="font-display text-5xl sm:text-6xl text-warm">1962</p>
          <p className="mt-2">Ypsilon grundas den 20 mars som Norrlands nations allra första damförening.</p>
        </SidebarCard>
      }
    />
  );
}
