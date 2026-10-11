"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV, type NavItem } from "./nav";

function isActive(pathname: string, item: NavItem) {
  if (item.href === "/") return pathname === "/";
  const hrefs = [item.href, ...(item.children?.map((c) => c.href) ?? [])];
  return hrefs.some((h) => pathname === h || pathname.startsWith(h + "/"));
}

const linkBase = "relative block px-3 py-2 text-[0.85rem] font-medium tracking-[0.08em] uppercase transition-colors";

function ActiveBar() {
  return <span className="absolute inset-x-3 -bottom-[14px] h-[2px] bg-[#c5a059]" aria-hidden />;
}

function Dropdown({ item, active }: { item: NavItem; active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <li
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${linkBase} flex items-center gap-1 ${active ? "text-[#dfbe76]" : "text-[#d6cdbd] hover:text-[#f8edd6]"}`}
      >
        {item.label}
        <ChevronDown size={14} className={`transition-transform opacity-75 ${open ? "rotate-180" : ""}`} aria-hidden />
        {active && <ActiveBar />}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 pt-3">
          <ul className="min-w-56 rounded-lg border border-[#c5a059]/30 bg-[#131620] py-2 text-[#e2d8c6] shadow-2xl shadow-black/60">
            {item.children!.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-2.5 text-[0.92rem] transition-colors ${
                    pathname === c.href
                      ? "bg-[#1e2330] font-semibold text-[#dfbe76]"
                      : "text-[#d6cdbd] hover:bg-[#1e2330] hover:text-[#f8edd6]"
                  }`}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[#c5a059]/25">
      {/* Blur på eget lager: backdrop-filter på headern skulle låsa den fasta mobilmenyn inuti headern */}
      <div
        className="absolute inset-x-0 top-0 -bottom-px -z-10 bg-[#0d0f14]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0d0f14]/90"
        aria-hidden
      />
      <div className="mx-auto flex h-[4.75rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" onClick={closeMobile} className="group flex items-center gap-3.5" aria-label="Ypsilon, till startsidan">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/band.png" alt="" width={31} height={40} className="h-10 w-auto transition-transform group-hover:scale-105" />
          <div>
            <span className="block font-display text-[1.95rem] font-semibold leading-none tracking-wide text-[#fbf8f2]">
              Ypsilon
            </span>
            <span className="hidden font-serif text-[0.62rem] uppercase tracking-[0.25em] text-[#dfbe76] sm:block">
              Norrlands Nation
            </span>
          </div>
        </Link>

        <nav aria-label="Huvudmeny" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) =>
              item.children ? (
                <Dropdown key={item.label} item={item} active={isActive(pathname, item)} />
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item) ? "page" : undefined}
                    className={`${linkBase} ${isActive(pathname, item) ? "text-[#dfbe76]" : "text-[#d6cdbd] hover:text-[#f8edd6]"}`}
                  >
                    {item.label}
                    {isActive(pathname, item) && <ActiveBar />}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <button
          type="button"
          className="-mr-2 rounded-md p-2 text-[#e2d8c6] hover:text-[#dfbe76] lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobilmeny"
          aria-label={mobileOpen ? "Stäng menyn" : "Öppna menyn"}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          id="mobilmeny"
          aria-label="Huvudmeny"
          className="fixed inset-x-0 bottom-0 top-[4.75rem] overflow-y-auto border-t border-[#c5a059]/20 bg-[#0d0f14] px-4 pb-10 pt-4 lg:hidden"
        >
          <ul className="mx-auto max-w-md divide-y divide-[#c5a059]/15">
            {NAV.map((item) => (
              <li key={item.label} className="py-2">
                {item.children ? (
                  <>
                    <p className="font-serif text-xs font-semibold uppercase tracking-[0.22em] text-[#dfbe76] px-2 pb-1 pt-2">{item.label}</p>
                    <ul className="mt-1 space-y-1">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            onClick={closeMobile}
                            className={`block rounded px-3 py-2 text-[1.05rem] ${
                              pathname === c.href ? "font-semibold text-[#dfbe76]" : "text-[#d6cdbd]"
                            }`}
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={closeMobile}
                    className={`block rounded px-3 py-2.5 text-[1.1rem] ${
                      isActive(pathname, item) ? "font-semibold text-[#dfbe76]" : "text-[#d6cdbd]"
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
