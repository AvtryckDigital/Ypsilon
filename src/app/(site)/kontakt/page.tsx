import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { Container, Markdown, PageHeader, SectionTitle, SidebarCard } from "@/components/ui";
import { getContacts, getPage, getSettings } from "@/lib/data";

export async function generateMetadata() {
  const page = await getPage("kontakt");
  return { title: page?.title ?? "Kontakt", description: page?.intro ?? undefined };
}

export default async function ContactPage() {
  const [page, contacts, s] = await Promise.all([getPage("kontakt"), getContacts(), getSettings()]);

  return (
    <>
      <PageHeader eyebrow="Hör av dig" title={page?.title ?? "Kontakt"} intro={page?.intro} image={page?.image} />
      <Container className="grid gap-14 py-14 sm:py-20 lg:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="formular">
          <SectionTitle id="formular" title="Skriv till oss" />
          <Markdown className="mt-3 text-warm-muted">{page?.body}</Markdown>
          <div className="mt-6">
            <ContactForm accessKey={process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY} fallbackEmail={s.main_email} />
          </div>
        </section>

        <div className="space-y-10">
          {contacts.length > 0 && (
            <section aria-labelledby="styrelsekontakter">
              <SectionTitle id="styrelsekontakter" title="Kontakta rätt person" />
              <ul className="mt-6 grid gap-4">
                {contacts.map((c) => (
                  <li
                    key={c.id}
                    className="oxford-frame group relative overflow-hidden rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c5a059]/70 hover:shadow-md"
                  >
                    <p className="font-display text-xl text-warm transition-colors group-hover:text-[#8c6b2d]">{c.role}</p>
                    <a
                      href={`mailto:${c.email}`}
                      className="mt-1 inline-flex items-center gap-2 font-serif text-sm text-[#8c6b2d] underline decoration-[#8c6b2d]/30 underline-offset-4 hover:decoration-[#8c6b2d]"
                    >
                      {c.email}
                    </a>
                    {c.description && <p className="mt-2 text-[0.92rem] leading-relaxed text-warm-muted">{c.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <SidebarCard title="Följ och hitta oss">
            <div className="space-y-4 text-warm-muted">
              {(s.instagram || s.facebook) && (
                <p>
                  Följ oss på{" "}
                  {s.instagram && <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="text-warm underline decoration-warm/30 underline-offset-4 hover:decoration-warm">Instagram</a>}
                  {s.instagram && s.facebook && " och "}
                  {s.facebook && <a href={s.facebook} target="_blank" rel="noopener noreferrer" className="text-warm underline decoration-warm/30 underline-offset-4 hover:decoration-warm">Facebook</a>}
                  .
                </p>
              )}
              <p>
                Är du gammal medlem?{" "}
                <Link href="/gammal-medlem" className="text-warm underline decoration-warm/30 underline-offset-4 hover:decoration-warm">Uppdatera dina uppgifter</Link>
                {" "}så att vi kan nå dig inför jubileer.
              </p>
              {s.address && (
                <div className="pt-2">
                  <p className="eyebrow">Postadress</p>
                  <address className="mt-1 whitespace-pre-line not-italic leading-relaxed text-warm">{s.address}</address>
                </div>
              )}
            </div>
          </SidebarCard>
        </div>
      </Container>
    </>
  );
}
