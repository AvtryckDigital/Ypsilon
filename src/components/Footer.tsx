import Link from "next/link";
import { getSettings } from "@/lib/data";
import { Container, FacebookIcon, InstagramIcon } from "./ui";

export default async function Footer() {
  const s = await getSettings();
  const year = new Date().getFullYear();

  return (    //färg för footer bg ändras här:
    <footer className="mt-auto border-t border-[#c5a059]/25 bg-[var(--color-midnight)] text-[#d6cdbd]">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vapen-640.png" alt="" aria-hidden className="mb-4 w-20 opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
          <p className="font-display text-3xl text-[#fbf8f2]">Ypsilon</p>
          {s.tagline && <p className="mt-2 font-display text-lg italic text-[#dfbe76]">{s.tagline}</p>}
          {s.short_description && <p className="mt-4 text-[0.93rem] leading-relaxed text-[#b8ad9b]">{s.short_description}</p>}
        </div>

        <div>
          <h2 className="font-serif text-xs font-semibold uppercase tracking-[0.22em] text-[#dfbe76]">Kontakt</h2>
          {s.address && <address className="mt-4 whitespace-pre-line not-italic leading-relaxed text-[#d6cdbd]">{s.address}</address>}
          {s.main_email && (
            <a href={`mailto:${s.main_email}`} className="mt-3 inline-block text-[#fbf8f2] underline decoration-[#c5a059]/50 underline-offset-4 hover:decoration-[#c5a059]">
              {s.main_email}
            </a>
          )}
        </div>

        <div>
          <h2 className="font-serif text-xs font-semibold uppercase tracking-[0.22em] text-[#dfbe76]">Bankgiro &amp; Swish</h2>
          <dl className="mt-4 space-y-1">
            {s.bankgiro && (
              <div className="flex gap-2"><dt className="text-[#a09482]">Bankgiro</dt><dd className="font-semibold text-[#fbf8f2]">{s.bankgiro}</dd></div>
            )}
            {s.swish && (
              <div className="flex gap-2"><dt className="text-[#a09482]">Swish</dt><dd className="font-semibold text-[#fbf8f2]">{s.swish}</dd></div>
            )}
          </dl>
          {s.payment_text && <p className="mt-3 text-sm leading-relaxed text-[#b8ad9b]">{s.payment_text}</p>}
        </div>

        <div>
          <h2 className="font-serif text-xs font-semibold uppercase tracking-[0.22em] text-[#dfbe76]">Följ oss</h2>
          <ul className="mt-4 space-y-3">
            {s.instagram && (
              <li>
                <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-[#d6cdbd] hover:text-[#fbf8f2]">
                  <InstagramIcon /> Instagram
                </a>
              </li>
            )}
            {s.facebook && (
              <li>
                <a href={s.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-[#d6cdbd] hover:text-[#fbf8f2]">
                  <FacebookIcon /> Facebook
                </a>
              </li>
            )}
          </ul>
        </div>
      </Container>
      <div className="border-t border-[#c5a059]/15">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-5 text-xs font-serif tracking-wider uppercase text-[#a09482]">
          <p>© {year} Ypsilon · Damförening vid Norrlands nation, Uppsala</p>
          <div className="flex items-center gap-6">
            <Link href="/sitemap" className="hover:text-[#dfbe76]">Webbplatskarta</Link>
            <Link href="/admin" className="hover:text-[#dfbe76]">Logga in</Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}
