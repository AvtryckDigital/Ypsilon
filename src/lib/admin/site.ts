import type { Field } from "./fields";

// Redigerbara sidor. Sidorna har fasta adresser och kan bara ändras, inte skapas eller tas bort.
// usesImage: false döljer fältet för bild i sidhuvudet, för sidor som inte visar det.
export const PAGES: { slug: string; label: string; path: string; usesBody: boolean; usesImage?: boolean; note?: string }[] = [
  { slug: "hem", label: "Startsidan", path: "/", usesBody: true, usesImage: false, note: "Ingressen visas i den stora bilden överst och texten under ”Om oss”. Bilderna på startsidan väljs under Inställningar." },
  { slug: "om-ypsilon", label: "Vad är Ypsilon?", path: "/om-ypsilon", usesBody: true },
  { slug: "historia", label: "Historia", path: "/historia", usesBody: true },
  { slug: "gammal-medlem", label: "Gammal medlem?", path: "/gammal-medlem", usesBody: true },
  { slug: "kontakt", label: "Kontakt", path: "/kontakt", usesBody: true, note: "Texten visas ovanför formuläret." },
  { slug: "kalendarium", label: "Kalendarium", path: "/kalendarium", usesBody: true, note: "Texten visas ovanför evenemangen." },
  { slug: "nyheter", label: "Nyheter", path: "/nyheter", usesBody: false },
  { slug: "sangbok", label: "Sångbok", path: "/sangbok", usesBody: false },
  { slug: "galleri", label: "Galleri", path: "/galleri", usesBody: false },
  { slug: "styrelsen", label: "Styrelsen", path: "/styrelsen", usesBody: true },
  { slug: "overypsor", label: "ÖverYpsor", path: "/overypsor", usesBody: true },
  { slug: "hedersypsor", label: "HedersYpsor", path: "/hedersypsor", usesBody: true },
];

export const PAGE_FIELDS: Field[] = [
  { name: "title", label: "Rubrik", type: "text", required: true, full: true },
  { name: "intro", label: "Ingress", type: "textarea", rows: 3, full: true, help: "Kort text som visas under rubriken." },
  { name: "image", label: "Bild i sidhuvudet", type: "image", help: "Visas stort bakom rubriken. Utan bild blir sidhuvudet blått." },
  { name: "body", label: "Text", type: "markdown", full: true },
];

export const SETTINGS_GROUPS: { title: string; description?: string; fields: Field[] }[] = [
  {
    title: "Startsidans bilder",
    description: "Lämna tomt för att automatiskt använda bilder från de senaste albumen i galleriet.",
    fields: [
      { name: "hero_image", label: "Stor bild överst", type: "image", help: "Hela bilden visas. På dator täcks vänster del av rubriken, och en suddig kopia fyller ytan om bilden inte är bred nog. På mobil visas rubriken under bilden." },
      { name: "hero_caption", label: "Bildtext", type: "text", placeholder: "t.ex. SnöYran 2026", help: "Visas litet i hörnet. Tomt = albumets namn om bilden kommer från galleriet. Töms när du byter bild, om du inte skriver en ny." },
      { name: "about_image", label: "Bild bredvid ”Om oss”", type: "image" },
    ],
  },
  {
    title: "Allmänt",
    fields: [
      { name: "tagline", label: "Slogan", type: "text", full: true, help: "Visas på startsidan och i sidfoten." },
      { name: "short_description", label: "Kort beskrivning av föreningen", type: "textarea", rows: 3, full: true, help: "Visas i sidfoten." },
      { name: "announcement", label: "Meddelande på startsidan", type: "text", full: true, help: "Visas som en guldfärgad rad på startsidan, t.ex. ”Anmälan till Älggasquen är öppen!”. Lämna tomt för att dölja." },
    ],
  },
  {
    title: "Kontakt och betalning",
    description: "Visas i sidfoten och på kontaktsidan.",
    fields: [
      { name: "main_email", label: "Föreningens huvudadress", type: "email" },
      { name: "address", label: "Postadress", type: "textarea", rows: 4 },
      { name: "bankgiro", label: "Bankgiro", type: "text" },
      { name: "swish", label: "Swish-nummer", type: "text" },
      { name: "payment_text", label: "Text om betalning", type: "textarea", rows: 3, full: true },
      { name: "instagram", label: "Instagram", type: "url", placeholder: "https://www.instagram.com/…" },
      { name: "facebook", label: "Facebook", type: "url", placeholder: "https://www.facebook.com/…" },
    ],
  },
  {
    title: "Styrelsen",
    fields: [
      { name: "board_heading", label: "Rubrik ovanför styrelsen", type: "text", full: true, placeholder: "t.ex. Ypsilons styrelse höstterminen 2026" },
      { name: "board_photo", label: "Gruppbild på styrelsen", type: "image" },
      { name: "board_photo_caption", label: "Bildtext till gruppbilden", type: "text" },
    ],
  },
  {
    title: "Gammal medlem",
    fields: [
      { name: "matrikel_url", label: "Matrikelbladet", type: "file", full: true, help: "PDF som gamla medlemmar fyller i. Ladda upp en ny fil för att byta." },
    ],
  },
];
