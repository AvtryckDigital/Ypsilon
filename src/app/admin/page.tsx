import Link from "next/link";
import { BookOpen, CalendarDays, CalendarPlus, Camera, FilePlus2, ImagePlus, Music, Newspaper, Users } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireUser } from "@/lib/auth";
import { first } from "@/lib/db";
import { getUpcomingEvents } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";

export const metadata = { title: "Översikt" };

async function count(table: string) {
  return (await first<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))?.n ?? 0;
}

export default async function Dashboard() {
  const user = await requireUser();
  const [posts, events, songs, albums, images, board, upcoming] = await Promise.all([
    count("posts"), count("events"), count("songs"), count("albums"), count("album_images"), count("board_members"),
    getUpcomingEvents(5),
  ]);

  const quick = [
    { href: "/admin/kalendarium/ny", label: "Nytt evenemang", icon: CalendarPlus },
    { href: "/admin/nyheter/ny", label: "Ny nyhet", icon: FilePlus2 },
    { href: "/admin/sangbok/ny", label: "Ny sång", icon: Music },
    { href: "/admin/galleri/ny", label: "Nytt album", icon: ImagePlus },
  ];
  const stats = [
    { href: "/admin/nyheter", label: "Nyheter", value: posts, icon: Newspaper },
    { href: "/admin/kalendarium", label: "Evenemang", value: events, icon: CalendarDays },
    { href: "/admin/sangbok", label: "Sånger", value: songs, icon: BookOpen },
    { href: "/admin/galleri", label: "Album", value: albums, sub: `${images} bilder`, icon: Camera },
    { href: "/admin/styrelsen", label: "Styrelseposter", value: board, icon: Users },
  ];

  return (
    <>
      <AdminHeader title={`Hej${user.name ? ` ${user.name}` : ""}!`} description="Här ändrar du allt innehåll på Ypsilons hemsida. Ändringar syns direkt när du sparar." />

      <section aria-labelledby="snabbval" className="mb-10">
        <h2 id="snabbval" className="sr-only">Snabbval</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quick.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-lg bg-navy px-4 py-4 font-semibold text-white hover:bg-navy-deep">
              <Icon size={20} className="text-gold" aria-hidden /> {label}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <section aria-labelledby="statistik">
          <h2 id="statistik" className="mb-3 text-2xl text-navy">Innehåll</h2>
          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
            {stats.map(({ href, label, value, sub, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-4 px-5 py-3.5 hover:bg-cream/40">
                  <Icon size={19} className="text-gold-ink" aria-hidden />
                  <span className="flex-1 font-medium">{label}</span>
                  {sub && <span className="text-sm text-muted">{sub}</span>}
                  <span className="min-w-8 text-right font-display text-2xl text-navy">{value}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="kommande">
          <div className="mb-3 flex items-end justify-between">
            <h2 id="kommande" className="text-2xl text-navy">Kommande evenemang</h2>
            <Link href="/admin/kalendarium" className="text-sm font-semibold text-royal hover:text-navy">Alla →</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-white px-5 py-8 text-center text-muted">
              Inga kommande evenemang.{" "}
              <Link href="/admin/kalendarium/ny" className="font-semibold text-royal">Lägg till ett</Link>
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-white">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/kalendarium/${e.id}`} className="flex items-baseline gap-4 px-5 py-3 hover:bg-cream/40">
                    <span className="w-32 shrink-0 text-sm font-semibold text-gold-ink">
                      {formatDate(e.starts_at, false)} {formatTime(e.starts_at)}
                    </span>
                    <span className="font-medium">{e.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-10 rounded-lg border border-gold-deep/40 bg-cream/60 p-5 text-[0.97rem]">
        <h2 className="font-display text-2xl text-navy">Bra att veta</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/85">
          <li>Texter på sidor som Historia och Vad är Ypsilon? ändras under <Link href="/admin/sidor" className="font-semibold text-royal">Sidor och texter</Link>.</li>
          <li>Kontaktuppgifter, Swish, bankgiro och sociala medier ändras under <Link href="/admin/installningar" className="font-semibold text-royal">Inställningar</Link>.</li>
          <li>Bilder förminskas automatiskt när du laddar upp dem, så du kan ladda upp direkt från mobilen.</li>
          <li>När styrelsen byts: lägg till de nya som <Link href="/admin/anvandare" className="font-semibold text-royal">administratörer</Link> och ta bort de gamla.</li>
        </ul>
      </section>
    </>
  );
}
