import Link from "next/link";
import type { CSSProperties } from "react";
import EventItem from "@/components/EventItem";
import PostCard from "@/components/PostCard";
import { Container, Markdown, SectionTitle } from "@/components/ui";
import { srcSet } from "@/lib/images";
import { getMorePhotos, getPage, getPhotoBySrc, getPosts, getRecentAlbumPhotos, getSettings, getUpcomingEvents, type Photo } from "@/lib/data";

function MosaicTile({ photo, big = false }: { photo: Photo; big?: boolean }) {
  return (
    <Link
      href={`/galleri/${photo.album_slug}`}
      className={`oxford-frame group relative block overflow-hidden rounded-sm border border-[#ded3c2] bg-[#0d0f14] shadow-sm transition hover:border-[#c5a059]/70 hover:shadow-md ${
        big ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-square md:aspect-auto"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.medium ?? photo.src}
        srcSet={srcSet(photo)}
        sizes={big ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14]/90 via-[#0d0f14]/30 to-transparent" aria-hidden />
      <span className={`absolute inset-x-0 bottom-0 p-4 leading-tight text-[#fbf8f2] ${big ? "font-display text-3xl text-[#dfbe76] sm:p-6" : "font-serif text-xs font-semibold uppercase tracking-wider text-[#dfbe76]"}`}>
        {photo.album_title}
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const [settings, page, events, posts, albumPhotos] = await Promise.all([
    getSettings(),
    getPage("hem"),
    getUpcomingEvents(3),
    getPosts(3),
    getRecentAlbumPhotos(8),
  ]);

  // Fyll på med fler bilder om det finns för få album.
  const photos =
    albumPhotos.length >= 7
      ? albumPhotos
      : [...albumPhotos, ...(await getMorePhotos(albumPhotos.map((p) => p.id), 7 - albumPhotos.length))];

  const landscape = photos.find((p) => (p.width ?? 0) > (p.height ?? 0)) ?? photos[0];
  const heroSrc = settings.hero_image || landscape?.src || null;
  const heroPhoto = photos.find((p) => p.src === heroSrc) || (heroSrc ? await getPhotoBySrc(heroSrc) : null);
  const heroSet = heroPhoto ? srcSet(heroPhoto) : undefined;
  const heroCaption = settings.hero_image ? settings.hero_caption || heroPhoto?.album_title : landscape?.album_title;
  const rest = photos.filter((p) => p.src !== heroSrc);
  const aboutPhoto = settings.about_image ? null : rest[0];
  const aboutSrc = settings.about_image || aboutPhoto?.medium || aboutPhoto?.src || null;
  const mosaic = rest.slice(settings.about_image ? 0 : 1, (settings.about_image ? 0 : 1) + 5);

  return (
    <>
      {/* Stor bild med vapnet och namnet ---------------------------------------------- */}
      {/*
        På mobil ligger bilden överst, minst 60 % av skärmhöjden (beskuren i sidled om den är bred), med
        rubriken under. På större skärmar visas hela bilden: rubriken ligger över den, och ytan bredvid bilden fylls
        med en suddig kopia av den. Bildens vänsterkant tonas ut mot rubriken.
      */}
      <section className="relative isolate flex flex-col overflow-hidden border-b border-[#c5a059]/30 bg-[#0d0f14] text-white sm:h-[calc(100svh-4.75rem)] sm:max-h-[56rem] sm:min-h-[34rem] sm:flex-row sm:items-end">
        {heroSrc && (
          <div
            className="relative aspect-[var(--hero-ratio)] min-h-[60svh] w-full sm:min-h-0 sm:absolute sm:inset-0 sm:-z-10 sm:aspect-auto"
            style={{ "--hero-ratio": `${heroPhoto?.width || 4} / ${heroPhoto?.height || 3}` } as CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroPhoto?.thumb ?? heroSrc}
              alt=""
              aria-hidden
              className="absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-50 blur-3xl sm:block"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroSrc}
              srcSet={heroSet}
              sizes="(min-width: 640px) 75vw, 100vw"
              alt=""
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover sm:left-auto sm:object-contain sm:right-0 sm:w-auto sm:max-w-full sm:[mask-image:linear-gradient(to_right,transparent,black_30%)]"
            />
            {/* Mobil: bilden tonar ut mot rubriken. Större skärmar: mörkare nertill och till vänster där texten står. */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0d0f14] to-transparent sm:hidden" aria-hidden />
            <div className="absolute inset-0 hidden bg-gradient-to-t from-[#131620] via-[#131620]/25 to-transparent sm:block" aria-hidden />
            <div className="absolute inset-0 hidden bg-gradient-to-r from-[#131620]/70 via-[#131620]/10 to-transparent sm:block" aria-hidden />
          </div>
        )}

        <Container className={`relative pb-14 sm:pb-24 sm:pt-32 ${heroSrc ? "-mt-6 pt-0" : "pt-24"}`}>
          <div className="max-w-3xl">
            {/* Heraldic crest och stämpel */}
            <div className="mb-6 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/vapen-640.png"
                alt="Ypsilons vapen"
                width={640}
                height={410}
                className="w-24 drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] sm:w-32"
              />
              <div className="border-l border-[#c5a059]/40 pl-4">
                <p className="font-serif text-xs font-semibold uppercase tracking-[0.28em] text-[#dfbe76]">
                  Damförening vid Norrlands Nation
                </p>
                <p className="font-serif text-[0.7rem] uppercase tracking-[0.25em] text-[#dfbe76]/80">
                  Uppsala
                </p>
              </div>
            </div>

            <h1 className="font-display text-[clamp(4.25rem,12vw,9.5rem)] font-semibold leading-none tracking-tight text-[#fbf8f2] [text-shadow:0_4px_28px_rgba(0,0,0,0.7)]">
              Ypsilon
            </h1>

            {(settings.home_tagline || settings.tagline) && (
              <p className="mt-6 max-w-xl font-display text-2xl italic leading-snug text-[#ede2cd] [text-shadow:0_2px_14px_rgba(0,0,0,0.7)] sm:text-[1.85rem]">
                »{settings.home_tagline || settings.tagline}«
              </p>
            )}
          </div>
        </Container>

        {heroCaption && (
          <p className="absolute bottom-4 right-4 hidden font-serif text-xs tracking-wider uppercase text-[#dfbe76]/80 sm:block">
            {heroCaption}
          </p>
        )}
      </section>

      {/* Om oss -------------------------------------------------------------------- */}
      <section className="py-20 sm:py-28">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {aboutSrc && (
            <div className="oxford-frame overflow-hidden rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-3 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={aboutSrc}
                srcSet={aboutPhoto ? srcSet(aboutPhoto) : undefined}
                sizes="(min-width: 1024px) 50vw, 100vw"
                alt=""
                loading="lazy"
                className="aspect-[4/5] w-full rounded-sm border border-[#ded3c2]/80 object-cover transition duration-700 hover:scale-[1.02] sm:aspect-[5/4]"
              />
            </div>
          )}
          <div>
            <p className="mb-2 font-serif text-xs font-semibold uppercase tracking-[0.25em] text-[#8c6b2d]">
              Norrlands äldsta damförening
            </p>
            <h2 className="text-4xl text-warm sm:text-5xl">{page?.title ?? "Välkommen till Ypsilon"}</h2>
            {page?.intro && <p className="mt-6 font-serif text-xl italic leading-relaxed text-[#5e544b]">{page.intro}</p>}
            {page?.body && <Markdown className="mt-4 text-[1.05rem] leading-relaxed text-warm-muted">{page.body}</Markdown>}
            <Link
              href="/om-ypsilon"
              className="mt-8 inline-flex items-center gap-2 border-b border-[#8c6b2d]/40 pb-0.5 font-serif text-sm font-semibold uppercase tracking-[0.2em] text-[#8c6b2d] transition-colors hover:border-[#8c6b2d] hover:text-warm"
            >
              <span>Läs mer om Ypsilon</span>
              <span aria-hidden>→</span>
            </Link>
          </div>
        </Container>
      </section>

      {/* Ur kalendariet: kommande evenemang ----------------------------------------------------------- */}
      <section className="border-y border-[#ded3c2] bg-[#f4eee1] py-20 sm:py-24">
        <Container>
          <SectionTitle title="Ur kalendariet" href="/kalendarium" link="Kalendariet" />
          {events.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {events.map((e) => <EventItem key={e.id} event={e} compact banner />)}
            </div>
          ) : (
            <p className="max-w-xl text-lg text-warm-muted">
              Inga datum är satta just nu. Nya Yror och sittningar läggs upp här så snart de är bestämda.
            </p>
          )}
        </Container>
      </section>

      {/* Bildmosaik från galleriet --------------------------------------------------------- */}
      {mosaic.length >= 3 && (
        <section className="py-20 sm:py-24">
          <Container>
            <SectionTitle title="Ur galleriet" href="/galleri" link="Alla album" />
            <div className="grid grid-cols-2 gap-2 md:h-[36rem] md:grid-cols-4 md:grid-rows-2">
              {mosaic.map((p, i) => (
                <MosaicTile key={p.id} photo={p} big={i === 0} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Nyheter -------------------------------------------------------------------- */}
      {posts.length > 0 && (
        <section className="pb-20 sm:pb-28">
          <Container>
            <SectionTitle title="Senaste nytt" href="/nyheter" link="Alla nyheter" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p, i) => <PostCard key={p.id} post={p} variant={i} />)}
            </div>
          </Container>
        </section>
      )}

    </>
  );
}
