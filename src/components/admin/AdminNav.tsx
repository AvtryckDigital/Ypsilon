"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen, CalendarDays, Camera, ExternalLink, FileText, Crown, Images, LayoutDashboard, LogOut,
  Mail, Menu, Newspaper, Settings, Star, UserCog, Users, X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";

const GROUPS = [
  { title: null, items: [{ href: "/admin", label: "Översikt", icon: LayoutDashboard }] },
  {
    title: "Innehåll",
    items: [
      { href: "/admin/nyheter", label: "Nyheter", icon: Newspaper },
      { href: "/admin/kalendarium", label: "Kalendarium", icon: CalendarDays },
      { href: "/admin/sangbok", label: "Sångbok", icon: BookOpen },
      { href: "/admin/galleri", label: "Galleri", icon: Camera },
      { href: "/admin/bilder", label: "Bilder", icon: Images },
    ],
  },
  {
    title: "Föreningen",
    items: [
      { href: "/admin/styrelsen", label: "Styrelsen", icon: Users },
      { href: "/admin/overypsor", label: "ÖverYpsor", icon: Crown },
      { href: "/admin/hedersypsor", label: "HedersYpsor", icon: Star },
      { href: "/admin/kontakter", label: "Kontakter", icon: Mail },
    ],
  },
  {
    title: "Hemsidan",
    items: [
      { href: "/admin/sidor", label: "Sidor och texter", icon: FileText },
      { href: "/admin/installningar", label: "Inställningar", icon: Settings },
      { href: "/admin/anvandare", label: "Administratörer", icon: UserCog },
    ],
  },
];

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Adminmeny" className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {GROUPS.map((g) => (
          <div key={g.title ?? "start"}>
            {g.title && <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-[0.15em] text-white/45">{g.title}</p>}
            <ul className="space-y-0.5">
              {g.items.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(href) ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-[0.97rem] transition-colors ${
                      isActive(href) ? "bg-white/12 font-semibold text-white" : "text-white/75 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <Icon size={18} className={isActive(href) ? "text-gold" : ""} aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-md px-3 py-2 text-white/75 hover:bg-white/8 hover:text-white">
          <ExternalLink size={18} aria-hidden /> Visa hemsidan
        </Link>
        <Link href="/admin/konto" onClick={() => setOpen(false)} className="block truncate rounded-md px-3 py-2 text-sm text-white/60 hover:bg-white/8 hover:text-white" title="Mitt konto">
          {email}
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-white/75 hover:bg-white/8 hover:text-white">
            <LogOut size={18} aria-hidden /> Logga ut
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobil */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 text-white lg:hidden">
        <Link href="/admin" className="font-display text-2xl">Ypsilon <span className="text-base text-gold">admin</span></Link>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Stäng menyn" : "Öppna menyn"} className="rounded p-1.5">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {open && <div className="fixed inset-x-0 bottom-0 top-[3.6rem] z-30 bg-navy lg:hidden">{nav}</div>}

      {/* Dator */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-navy text-white lg:flex">
        <div className="ribbon-thin" aria-hidden />
        <Link href="/admin" className="flex items-center gap-3 px-6 pb-2 pt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/band.png" alt="" className="h-9 w-auto" />
          <span className="font-display text-2xl leading-none">Ypsilon<span className="block font-sans text-xs uppercase tracking-[0.2em] text-gold">Admin</span></span>
        </Link>
        {nav}
      </aside>
    </>
  );
}
