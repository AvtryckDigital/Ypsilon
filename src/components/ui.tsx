import Link from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`ornament ${className}`} aria-hidden>
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path d="M7 0 L8.6 5.4 L14 7 L8.6 8.6 L7 14 L5.4 8.6 L0 7 L5.4 5.4 Z" fill="currentColor" />
      </svg>
    </div>
  );
}

/**
 * Bandet i guld och blått med Y:et, från Ypsilons grafiska profil.
 * Ritat som vektorgrafik så att det blir skarpt i alla storlekar.
 */
export function Bookmark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 120 160" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path d="M0 0H120V160L60 128L0 160Z" fill="#edc967" />
      <path d="M28 0H92V145L60 128L28 145Z" fill="#030972" />
      <path
        d="M37 58c9-2.4 17 1.6 20.5 9.8 1.6 3.8 2.5 8.4 2.5 13.7V103c0 2.6-.9 3.9-4.4 4.4h12.8c-3.5-.5-4.4-1.8-4.4-4.4V81.5c0-5.3.9-9.9 2.5-13.7C70.9 59.6 78.9 55.6 88 58c-7.8-3.7-17.8-1.6-23.4 6.6-.9 1.3-1.7 2.8-2.1 4.2-.4-1.4-1.2-2.9-2.1-4.2C54.8 56.4 44.8 54.3 37 58z"
        fill="#edc967"
      />
    </svg>
  );
}

/** Länk bakåt till överordnad sektion, enhetlig på alla undersidor. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group mb-8 inline-flex items-center gap-1.5 font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6b2d] transition-colors hover:text-[#1c1613]"
    >
      <span className="transition-transform group-hover:-translate-x-1" aria-hidden>
        ←
      </span>
      <span>{children}</span>
    </Link>
  );
}

/** Rubrikblock överst på varje undersida i stilen Dark Academia & Nordic Heritage. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  image,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string | null;
  image?: string | null;
  children?: ReactNode;
}) {
  return (
    <section
      className={`relative isolate overflow-hidden border-b border-[#c5a059]/30 bg-[#0d0f14] text-white ${image ? "min-h-[22rem] sm:min-h-[27rem]" : ""}`}
    >
      {/* Bandet i hörnet, som på föreningens inlägg */}
      <Bookmark className="absolute right-5 top-0 z-10 w-9 drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)] sm:right-8 sm:w-12" />
      {image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_30%]" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0d0f14] via-[#0d0f14]/65 to-[#0d0f14]/20" aria-hidden />
        </>
      )}
      <Container
        className={`relative flex flex-col justify-end pb-12 pt-16 sm:pb-16 sm:pt-24 ${
          image ? "min-h-[22rem] sm:min-h-[27rem]" : ""
        }`}
      >
        {/* Ypsilons vapen som stämpel eller subtilt vattenmärke */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/vapen-vit-640.png"
          alt=""
          aria-hidden
          className={`pointer-events-none absolute bottom-10 right-4 hidden w-32 md:block lg:w-44 ${
            image ? "opacity-90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]" : "opacity-[0.12]"
          }`}
        />
        {eyebrow && (
          <p className="mb-3 font-serif text-xs font-semibold uppercase tracking-[0.25em] text-[#dfbe76] sm:text-sm">{eyebrow}</p>
        )}
        <h1 className="max-w-3xl font-display text-[2.85rem] leading-[1.02] text-[#fbf8f2] sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        {intro && (
          <p className="mt-5 max-w-2xl font-serif text-lg italic leading-relaxed text-[#d6cdbd] sm:text-xl">
            {intro}
          </p>
        )}
        {children}
      </Container>
    </section>
  );
}

/** Visar text skriven i redigeraren. Rå HTML visas inte, så innehållet kan inte bryta sidan. */
export function Markdown({ children, className = "" }: { children: string | null | undefined; className?: string }) {
  if (!children?.trim()) return null;
  return (
    <div className={`prose-y ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="whitespace-pre-line">{children}</p>,
          a: ({ href = "", children }) => {
            const external = /^https?:\/\//.test(href);
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            );
          },
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} loading="lazy" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-sm border border-dashed border-[#ded3c2] bg-[#fbf9f5] px-6 py-14 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-linen text-[#8c6b2d]">
        <span className="font-serif text-lg font-bold leading-none">Y</span>
      </div>
      <p className="font-display text-2xl text-warm">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-warm-muted">{children}</div>}
    </div>
  );
}

/** Enhetlig sidoruta för extrainformation på innehållssidor. */
export function SidebarCard({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`oxford-frame rounded-sm border border-[#ded3c2] bg-[#fbf9f5] p-6 shadow-sm shadow-espresso/5 ${className}`}>
      {title && <h3 className="font-display text-2xl text-warm">{title}</h3>}
      <div className={title ? "mt-3 text-[0.98rem] leading-relaxed text-warm-muted" : "text-[0.98rem] leading-relaxed text-warm-muted"}>
        {children}
      </div>
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline" | "gold";
}) {
  const styles = {
    primary: "border border-[#c5a059]/40 bg-[#131620] text-[#fbf8f2] hover:bg-[#1e2330] hover:border-[#c5a059] shadow-sm",
    outline: "border border-[#8c6b2d]/30 text-[#261f1c] hover:border-[#8c6b2d] hover:bg-white shadow-sm",
    gold: "bg-[#c5a059] text-[#0d0f14] font-semibold hover:bg-[#c5a059] shadow-sm",
  }[variant];
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.92rem] font-medium tracking-wide uppercase transition-all hover:-translate-y-0.5 ${styles}`}
    >
      {children}
    </Link>
  );
}

/**
 * Enhetlig sektionsrubrik med klassisk akademisk avdelare.
 */
export function SectionTitle({
  eyebrow,
  title,
  href,
  link,
  action,
  className = "",
  id,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  link?: string;
  action?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={`relative mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-[#ded3c2] pb-4 sm:mb-10 sm:pb-5 ${className}`}>
      <span className="absolute -bottom-px left-0 h-[2px] w-12 bg-[#c5a059]" aria-hidden />
      <div>
        {eyebrow && <p className="font-serif text-[0.8rem] font-semibold uppercase tracking-[0.22em] text-[#8c6b2d] mb-1.5">{eyebrow}</p>}
        <h2 id={id} className="text-3xl text-warm sm:text-4xl lg:text-[2.6rem]">{title}</h2>
      </div>
      {action ? (
        action
      ) : href && link ? (
        <Link href={href} className="group inline-flex items-center gap-1.5 font-serif text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6b2d] transition-colors hover:text-warm">
          <span>{link}</span>
          <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
        </Link>
      ) : null}
    </div>
  );
}

export function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z" />
    </svg>
  );
}

export function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
