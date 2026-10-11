import ContentPage, { pageMetadata } from "@/components/ContentPage";
import { SidebarCard } from "@/components/ui";
import { getContacts, getRecentAlbumPhotos } from "@/lib/data";

export const generateMetadata = () => pageMetadata("om-ypsilon");

export default async function AboutPage() {
  const [contacts, photos] = await Promise.all([getContacts(), getRecentAlbumPhotos(3)]);
  const yngling = contacts.find((c) => c.role.toLowerCase() === "yngling");

  return (
    <ContentPage
      slug="om-ypsilon"
      eyebrow="Om Ypsilon"
      photos={photos}
      aside={
        yngling && (
          <SidebarCard title="Vill du bli medlem?">
            <p>{yngling.description}</p>
            <a href={`mailto:${yngling.email}`} className="mt-4 inline-block font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6b2d] hover:text-warm">
              {yngling.email} →
            </a>
          </SidebarCard>
        )
      }
    />
  );
}
