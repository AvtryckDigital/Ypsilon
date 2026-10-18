import type { Field } from "./fields";

export type PageDef = {
  slug: string;
  label: string;
  path: string;
  usesBody: boolean;
  usesImage?: boolean;
  note?: string;
  customFields?: Field[];
};

export const HOME_PAGE_FIELDS: Field[] = [
  { name: "title", label: "Sidrubrik", type: "text", required: true, full: true, help: "Sajtens titel som visas i webbläsarfliken och för sökmotorer." },
  {
    name: "home_tagline",
    label: "Slogan på startsidan",
    type: "text",
    full: true,
    help: "Visas i citattecken under rubriken på startsidan, t.ex. »Till glädje och prydnad för Norrlands nation sedan 1962«. Slogan i sidfoten ändras separat under Inställningar.",
  },
  { name: "intro", label: "Ingress", type: "textarea", rows: 2, full: true, help: "Kort text som sammanfattar föreningen på startsidan." },
  {
    name: "hero_image",
    label: "Stor bild överst",
    type: "image",
    group: "Startsidans bilder",
    groupDescription: "Huvudbilden överst och bilden bredvid presentationstexten. Lämna tomt för att automatiskt visa bilder från de senaste albumen i galleriet.",
    help: "Täcker hela skärmen (gärna i formatet 16:9). Lämna tomt för att automatiskt visa en bild från det senaste gallerialbumet.",
  },
  {
    name: "hero_caption",
    label: "Bildtext till stora omslagsbilden",
    type: "text",
    placeholder: "t.ex. SnöYran 2026",
    help: "Visas i hörnet på bilden. Lämna tomt för att automatiskt visa albumets namn om bilden hämtas från galleriet.",
  },
  {
    name: "about_image",
    label: "Bild under stora omslagsbilden",
    type: "image",
    help: "Bild bredvid presentationstexten. Lämna tomt för att automatiskt visa en bild från galleriet.",
  },
  {
    name: "body",
    label: "Text under stora omslagsbilden",
    type: "markdown",
    full: true,
    group: "Presentationstext",
    groupDescription: "",
  },
];

export const BOARD_PAGE_FIELDS: Field[] = [
  { name: "title", label: "Rubrik", type: "text", required: true, full: true },
  { name: "intro", label: "Ingress", type: "textarea", rows: 3, full: true, help: "Kort text under sidhuvudets rubrik." },
  { name: "image", label: "Bild i sidhuvudet", type: "image", help: "Visas stort bakom rubriken. Utan bild visas en mörk bakgrund." },
  { name: "body", label: "Inledande text", type: "markdown", full: true, help: "Text som visas ovanför gruppbilden och styrelsemedlemmarna." },
  {
    name: "board_heading",
    label: "Rubrik ovanför styrelsen",
    type: "text",
    full: true,
    placeholder: "t.ex. Ypsilons styrelse höstterminen 2026",
    group: "Styrelsens sektion och gruppbild",
    groupDescription: "Gruppbild och rubrik ovanför medlemmarna. Enskilda styrelsemedlemmar läggs till och ändras under ”Styrelsen” i huvudmenyn.",
    help: "Visas som rubrik ovanför korten med styrelsemedlemmar.",
  },
  {
    name: "board_photo",
    label: "Gruppbild på styrelsen",
    type: "image",
    help: "Stor bild som visas inramad mellan texten och styrelsemedlemmarna.",
  },
  {
    name: "board_photo_caption",
    label: "Bildtext till gruppbilden",
    type: "text",
    help: "Visas centrerat under gruppbilden.",
  },
];

export const FORMER_MEMBER_PAGE_FIELDS: Field[] = [
  { name: "title", label: "Rubrik", type: "text", required: true, full: true },
  { name: "intro", label: "Ingress", type: "textarea", rows: 3, full: true, help: "Kort text som visas under rubriken." },
  { name: "image", label: "Bild i sidhuvudet", type: "image", help: "Visas stort bakom rubriken." },
  { name: "body", label: "Text", type: "markdown", full: true },
  {
    name: "matrikel_url",
    label: "Matrikelbladet (PDF)",
    type: "file",
    full: true,
    group: "Matrikelblad",
    groupDescription: "Dokument som gamla medlemmar laddar ner från sidorutan.",
    help: "Ladda upp en PDF som gamla medlemmar kan ladda ner och fylla i.",
  },
];

// Redigerbara sidor. Sidorna har fasta adresser och kan bara ändras, inte skapas eller tas bort.
export const PAGES: PageDef[] = [
  {
    slug: "hem",
    label: "Startsidan",
    path: "/",
    usesBody: true,
    usesImage: false,
    note: "Här ändrar du allt på startsidan",
    customFields: HOME_PAGE_FIELDS,
  },
  { slug: "om-ypsilon", label: "Vad är Ypsilon?", path: "/om-ypsilon", usesBody: true, note: "Text och bild i sidhuvudet för sidan ”Vad är Ypsilon?”." },
  { slug: "historia", label: "Historia", path: "/historia", usesBody: true, note: "Föreningens historik och bild i sidhuvudet." },
  {
    slug: "gammal-medlem",
    label: "Gammal medlem?",
    path: "/gammal-medlem",
    usesBody: true,
    note: "Texten för gamla medlemmar och uppladdning av matrikelbladet (PDF).",
    customFields: FORMER_MEMBER_PAGE_FIELDS,
  },
  { slug: "kontakt", label: "Kontakt", path: "/kontakt", usesBody: true, note: "Texten som visas ovanför kontaktformuläret. E-postadresser och styrelsekontakter ändras under ”Kontakter” i menyn." },
  { slug: "kalendarium", label: "Kalendarium", path: "/kalendarium", usesBody: true, note: "Texten ovanför kalendariet. Enskilda evenemang ändras under ”Kalendarium” i menyn." },
  { slug: "nyheter", label: "Nyheter", path: "/nyheter", usesBody: false, note: "Rubrik och ingress för nyhetsarkivet. Inlägg skapas och ändras under ”Nyheter” i menyn." },
  { slug: "sangbok", label: "Sångbok", path: "/sangbok", usesBody: false, note: "Rubrik och ingress för sångboken. Enskilda sånger ändras under ”Sångbok” i menyn." },
  { slug: "galleri", label: "Galleri", path: "/galleri", usesBody: false, note: "Rubrik och ingress för bildgalleriet. Album och bilder ändras under ”Galleri” i menyn." },
  {
    slug: "styrelsen",
    label: "Styrelsen",
    path: "/styrelsen",
    usesBody: true,
    note: "Rubrik, ingress, inledande text, gruppbild samt sektionsrubrik. Enskilda styrelsemedlemmar läggs till och ändras under ”Styrelsen” i menyn.",
    customFields: BOARD_PAGE_FIELDS,
  },
  { slug: "overypsor", label: "ÖverYpsor", path: "/overypsor", usesBody: true, note: "Text och bild i sidhuvudet. Förteckningen över ÖverYpsor ändras under ”ÖverYpsor” i menyn." },
  { slug: "hedersypsor", label: "HedersYpsor", path: "/hedersypsor", usesBody: true, note: "Text och bild i sidhuvudet. Förteckningen över hedersmedlemmar ändras under ”HedersYpsor” i menyn." },
];

export const PAGE_FIELDS: Field[] = [
  { name: "title", label: "Rubrik", type: "text", required: true, full: true },
  { name: "intro", label: "Ingress", type: "textarea", rows: 3, full: true, help: "Kort text som visas under rubriken." },
  { name: "image", label: "Bild i sidhuvudet", type: "image", help: "Visas stort bakom rubriken. Utan bild blir sidhuvudet mörkt." },
  { name: "body", label: "Text", type: "markdown", full: true },
];

export function getPageFields(def: PageDef): Field[] {
  if (def.customFields) return def.customFields;
  return PAGE_FIELDS.filter(
    (f) => (def.usesBody || f.name !== "body") && (def.usesImage !== false || f.name !== "image"),
  );
}

export const SETTINGS_GROUPS: { title: string; description?: string; fields: Field[] }[] = [
  {
    title: "Sidfot (Footer)",
    description: "Visas längst ner på alla sidor på hela hemsidan.",
    fields: [
      {
        name: "tagline",
        label: "Slogan i sidfoten",
        type: "text",
        full: true,
        help: "Visas i sidfoten (footer) på alla sidor. Slogan på startsidan ändras separat under Sidor & texter → Startsidan.",
      },
      {
        name: "short_description",
        label: "Kort beskrivning av föreningen",
        type: "textarea",
        rows: 3,
        full: true,
        help: "Visas i sidfoten (footer) under föreningens namn och vapen.",
      },
    ],
  },
  {
    title: "Kontaktuppgifter",
    description: "Visas i sidfoten (footer) och på kontaktsidan (/kontakt).",
    fields: [
      {
        name: "main_email",
        label: "Föreningens e-postadress",
        type: "email",
        help: "Visas i sidfoten (footer) och används som reservadress i kontaktformuläret på kontaktsidan (/kontakt).",
      },
      {
        name: "address",
        label: "Postadress",
        type: "textarea",
        rows: 4,
        help: "Visas i sidfoten (footer), på kontaktsidan (/kontakt) och på sidan för gamla medlemmar (/gammal-medlem).",
      },
    ],
  },
  {
    title: "Betalning (Bankgiro & Swish)",
    description: "Visas i sidfoten (footer) på alla sidor.",
    fields: [
      {
        name: "bankgiro",
        label: "Bankgiro",
        type: "text",
        help: "Visas i sidfoten (footer).",
      },
      {
        name: "swish",
        label: "Swish-nummer",
        type: "text",
        help: "Visas i sidfoten (footer).",
      },
      {
        name: "payment_text",
        label: "Information om betalning",
        type: "textarea",
        rows: 3,
        full: true,
        help: "Visas i sidfoten (footer) under Bankgiro och Swish.",
      },
    ],
  },
  {
    title: "Sociala medier",
    description: "Länkar som visas i sidfoten (footer) och på kontaktsidan (/kontakt).",
    fields: [
      {
        name: "instagram",
        label: "Instagram",
        type: "url",
        placeholder: "https://www.instagram.com/…",
        help: "Visas i sidfoten (footer) och på kontaktsidan (/kontakt).",
      },
      {
        name: "facebook",
        label: "Facebook",
        type: "url",
        placeholder: "https://www.facebook.com/…",
        help: "Visas i sidfoten (footer) och på kontaktsidan (/kontakt).",
      },
    ],
  },
];
