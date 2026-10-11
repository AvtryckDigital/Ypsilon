import ContentPage, { pageMetadata } from "@/components/ContentPage";
import { SidebarCard } from "@/components/ui";
import { getSettings } from "@/lib/data";

export const generateMetadata = () => pageMetadata("gammal-medlem");

export default async function FormerMemberPage() {
  const s = await getSettings();
  return (
    <ContentPage
      slug="gammal-medlem"
      eyebrow="Medlemsregister"
      aside={
        <>
          {s.matrikel_url && (
            <SidebarCard title="Matrikelbladet">
              <p>Fyll i och skicka till oss inför jubileer och Yror.</p>
              <a
                href={s.matrikel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6b2d] hover:text-warm"
              >
                Ladda ner (PDF) →
              </a>
            </SidebarCard>
          )}
          {s.address && (
            <SidebarCard title="Postadress">
              <address className="whitespace-pre-line not-italic leading-relaxed">{s.address}</address>
            </SidebarCard>
          )}
        </>
      }
    />
  );
}
