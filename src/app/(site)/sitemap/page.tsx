import Link from "next/link";
import type { Metadata } from "next";
import { Container, PageHeader, BackLink, SectionTitle, Ornament } from "@/components/ui";
import { getPosts, getUpcomingEvents, getAlbums, getSongs } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { Post, YEvent, Album, Song } from "@/lib/types";

export const metadata: Metadata = {
  title: "Webbplatskarta · Ypsilon",
  description: "Fullständig översikt över alla sidor, nyheter, evenemang och arkiv på Ypsilons webbplats.",
};

const SECTIONS = [
  {
    title: "Om Ypsilon",
    description: "Föreningens historia, syfte, styrelse och medlemmar",
    links: [
      { href: "/", label: "Startsida", desc: "Nyhetsöversikt, presentation och kommande evenemang" },
      { href: "/om-ypsilon", label: "Vad är Ypsilon?", desc: "Om föreningen, gemenskap och hur du blir medlem" },
      { href: "/historia", label: "Historia", desc: "Grundandet 1962 och föreningens anor vid Norrlands nation" },
      { href: "/styrelsen", label: "Styrelsen", desc: "Sittande styrelse och funktionärer" },
      { href: "/overypsor", label: "ÖverYpsor", desc: "Förteckning över tidigare ordförande genom tiderna" },
      { href: "/hedersypsor", label: "HedersYpsor", desc: "Föreningens hedersmedlemmar och deras motiveringar" },
    ],
  },
  {
    title: "Aktiviteter & Program",
    description: "Evenemang, yror, fester och nyhetsinlägg",
    links: [
      { href: "/kalendarium", label: "Kalendarium", desc: "Terminsprogram med gasquer, möten och evenemang" },
      { href: "/kalendarium.ics", label: "Prenumerera på kalendern", desc: "Automatisk iCal-kalenderprenumeration (.ics) för dator och mobil" },
      { href: "/nyheter", label: "Nyheter & Inlägg", desc: "Aktuella nyheter, rapporter och meddelanden" },
    ],
  },
  {
    title: "Kultur & Galleri",
    description: "Sångskatt, melodier och bildminnen",
    links: [
      { href: "/sangbok", label: "Sångbok", desc: "Vår sångsamling med bordsvisor, snapsvisor och melodier" },
      { href: "/galleri", label: "Bildgalleri", desc: "Fotografier och bildalbum från fester, yror och sammankomster" },
    ],
  },
  {
    title: "Kontakt & Medlemmar",
    description: "Vägar in och information för alumner",
    links: [
      { href: "/kontakt", label: "Kontakt", desc: "Kontaktuppgifter och formulär till styrelsen" },
      { href: "/gammal-medlem", label: "Gammal medlem?", desc: "Information och matrikeluppgifter för gamla medlemmar" },
      { href: "/login", label: "Logga in", desc: "Inloggning för styrelse och administratörer" },
    ],
  },
  {
    title: "Tekniska resurser",
    description: "Resurser för sökmotorer och maskinell läsning",
    links: [
      { href: "/sitemap.xml", label: "XML Sitemap (sitemap.xml)", desc: "Maskinläsbar webbplatskarta enligt sitemaps.org-standarden" },
      { href: "/robots.txt", label: "Robots.txt", desc: "Indexering- och sökmotorregler" },
    ],
  },
];

export default async function SitemapPage() {
  let posts: Post[] = [];
  let events: YEvent[] = [];
  let albums: Album[] = [];
  let songs: Song[] = [];

  try {
    const [p, e, a, s] = await Promise.all([
      getPosts(8),
      getUpcomingEvents(8),
      getAlbums(),
      getSongs(),
    ]);
    posts = p;
    events = e;
    albums = a;
    songs = s;
  } catch (err) {
    console.error("Kunde inte ladda dynamiskt innehåll till webbplatskartan:", err);
  }

  return (
    <>
      <PageHeader
        eyebrow="Översikt"
        title="Webbplatskarta"
        intro="En fullständig och strukturerad översikt över hela Ypsilons webbplats — alla sidor, avdelningar, artiklar, sånger och bildalbum."
      />

      <Container className="py-12 sm:py-16">
        <BackLink href="/">Tillbaka till startsidan</BackLink>

        {/* Huvudsektioner */}
        <div className="mb-14">
          <SectionTitle
            eyebrow="Navigering"
            title="Sidor & avdelningar"
            className="mb-8"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((sec) => (
              <div
                key={sec.title}
                className="oxford-frame flex flex-col rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-6 shadow-sm"
              >
                <h3 className="font-display text-2xl text-warm">{sec.title}</h3>
                <p className="mt-1 text-xs text-warm-muted">{sec.description}</p>
                <div className="my-4 h-px bg-[#e6dfcd]" />
                <ul className="space-y-3.5">
                  {sec.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group flex flex-col text-sm text-warm hover:text-[#8c6b2d]"
                      >
                        <span className="font-semibold decoration-[#c5a059]/40 underline-offset-4 group-hover:underline">
                          {item.label}
                        </span>
                        {item.desc && (
                          <span className="text-xs text-warm-muted leading-tight mt-0.5">
                            {item.desc}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamiskt innehåll: Nyheter & Evenemang */}
        {(posts.length > 0 || events.length > 0) && (
          <div className="mb-14 grid gap-8 lg:grid-cols-2">
            {posts.length > 0 && (
              <div className="oxford-frame rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-6 shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-2xl text-warm">Senaste nyheterna</h3>
                  <Link
                    href="/nyheter"
                    className="font-serif text-xs font-semibold uppercase tracking-wider text-[#8c6b2d] hover:underline"
                  >
                    Visa alla →
                  </Link>
                </div>
                <div className="my-4 h-px bg-[#e6dfcd]" />
                <ul className="divide-y divide-[#e6dfcd]/60">
                  {posts.map((post) => (
                    <li key={post.slug} className="py-2.5 first:pt-0 last:pb-0">
                      <Link
                        href={`/nyheter/${post.slug}`}
                        className="group flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 text-sm text-warm hover:text-[#8c6b2d]"
                      >
                        <span className="font-medium group-hover:underline">{post.title}</span>
                        {post.published_at && (
                          <span className="shrink-0 font-serif text-xs text-warm-muted">
                            {formatDate(post.published_at)}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {events.length > 0 && (
              <div className="oxford-frame rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-6 shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-2xl text-warm">Kommande evenemang</h3>
                  <Link
                    href="/kalendarium"
                    className="font-serif text-xs font-semibold uppercase tracking-wider text-[#8c6b2d] hover:underline"
                  >
                    Hela kalendariet →
                  </Link>
                </div>
                <div className="my-4 h-px bg-[#e6dfcd]" />
                <ul className="divide-y divide-[#e6dfcd]/60">
                  {events.map((ev) => (
                    <li key={ev.id} className="py-2.5 first:pt-0 last:pb-0">
                      <Link
                        href={`/kalendarium/${ev.id}`}
                        className="group flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 text-sm text-warm hover:text-[#8c6b2d]"
                      >
                        <span className="font-medium group-hover:underline">{ev.title}</span>
                        <span className="shrink-0 font-serif text-xs text-warm-muted">
                          {formatDate(ev.starts_at, false)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Dynamiskt innehåll: Gallerialbum & Sångbok */}
        {(albums.length > 0 || songs.length > 0) && (
          <div className="mb-12 grid gap-8 lg:grid-cols-2">
            {albums.length > 0 && (
              <div className="oxford-frame rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-6 shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-2xl text-warm">Bildalbum</h3>
                  <Link
                    href="/galleri"
                    className="font-serif text-xs font-semibold uppercase tracking-wider text-[#8c6b2d] hover:underline"
                  >
                    Alla album ({albums.length}) →
                  </Link>
                </div>
                <div className="my-4 h-px bg-[#e6dfcd]" />
                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  {albums.slice(0, 10).map((album) => (
                    <Link
                      key={album.slug}
                      href={`/galleri/${album.slug}`}
                      className="group block truncate font-medium text-warm hover:text-[#8c6b2d] hover:underline"
                    >
                      {album.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {songs.length > 0 && (
              <div className="oxford-frame rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-6 shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-2xl text-warm">Sånger i sångboken</h3>
                  <Link
                    href="/sangbok"
                    className="font-serif text-xs font-semibold uppercase tracking-wider text-[#8c6b2d] hover:underline"
                  >
                    Hela sångboken ({songs.length}) →
                  </Link>
                </div>
                <div className="my-4 h-px bg-[#e6dfcd]" />
                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  {songs.slice(0, 10).map((song) => (
                    <Link
                      key={song.slug}
                      href={`/sangbok/${song.slug}`}
                      className="group block truncate text-warm hover:text-[#8c6b2d] hover:underline"
                    >
                      {song.number !== null && song.number !== undefined && (
                        <span className="font-serif text-xs text-warm-muted mr-1.5">
                          #{song.number}
                        </span>
                      )}
                      <span className="font-medium">{song.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-16 flex justify-center">
          <Ornament />
        </div>
      </Container>
    </>
  );
}
