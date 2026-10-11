export type NavItem = { href: string; label: string; children?: { href: string; label: string }[] };

export const NAV: NavItem[] = [
  { href: "/", label: "Hem" },
  {
    href: "/om-ypsilon",
    label: "Om Ypsilon",
    children: [
      { href: "/om-ypsilon", label: "Vad är Ypsilon?" },
      { href: "/historia", label: "Historia" },
      { href: "/overypsor", label: "ÖverYpsor" },
      { href: "/hedersypsor", label: "HedersYpsor" },
    ],
  },
  { href: "/kalendarium", label: "Kalendarium" },
  { href: "/nyheter", label: "Nyheter" },
  { href: "/sangbok", label: "Sångbok" },
  { href: "/galleri", label: "Galleri" },
  { href: "/styrelsen", label: "Styrelsen" },
  {
    href: "/kontakt",
    label: "Kontakt",
    children: [
      { href: "/kontakt", label: "Kontakta oss" },
      { href: "/gammal-medlem", label: "Gammal medlem?" },
    ],
  },
];
