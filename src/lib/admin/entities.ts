import "server-only";
import { firstYear, slugify } from "../format";
import type { Field, ListColumn } from "./fields";

type Values = Record<string, string | number | null>;

export type Entity = {
  /** Del av adressen i admin, t.ex. /admin/nyheter */
  key: string;
  table: string;
  label: string;
  singular: string;
  description: string;
  fields: Field[];
  columns: ListColumn[];
  orderBy: string;
  /** Kolumner som söks igenom i listan. */
  search?: string[];
  /** Kolumnen som visas som länk/rubrik i listan. */
  titleColumn: string;
  /** Skapa adressnamn (slug) automatiskt från denna kolumn. */
  slugFrom?: string;
  /** Rader kan flyttas upp och ner (kräver kolumnen sort_order). */
  sortable?: boolean;
  /** Publika sidor som ska visa ändringen. */
  revalidate: string[];
  /** Räknar fram extra värden innan raden sparas. */
  derive?: (values: Values) => Values;
  /** Extra kontroller som returnerar fel per fält. */
  validate?: (values: Values) => Record<string, string> | null;
  /** Adress till den publika sidan för en rad, för knappen "Visa på hemsidan". */
  publicPath?: (row: Record<string, unknown>) => string;
};

const KIND_OPTIONS = [
  { value: "vanlig", label: "Vanligt evenemang" },
  { value: "yra", label: "Extra viktigt evenemang" },
  { value: "extern", label: "Arrangeras inte av Ypsilon (tips)" },
];

export const ENTITIES: Entity[] = [
  {
    key: "nyheter",
    table: "posts",
    label: "Nyheter",
    singular: "nyhet",
    description: "Inlägg som visas under Nyheter och på startsidan.",
    titleColumn: "title",
    slugFrom: "title",
    orderBy: "published_at DESC, id DESC",
    search: ["title", "body"],
    revalidate: ["/", "/nyheter"],
    publicPath: (r) => `/nyheter/${r.slug}`,
    columns: [
      { name: "title", label: "Rubrik" },
      { name: "published_at", label: "Datum", format: "date" },
      { name: "published", label: "Publicerad", format: "boolean" },
    ],
    fields: [
      { name: "title", label: "Rubrik", type: "text", required: true, full: true },
      { name: "published_at", label: "Publiceringsdatum", type: "date", required: true, help: "Nyheter sorteras efter detta datum." },
      { name: "author", label: "Skribent", type: "text", placeholder: "t.ex. ÖverYpsan" },
      { name: "published", label: "Visa på hemsidan", type: "checkbox", defaultValue: true, help: "Bocka ur för att spara som utkast." },
      { name: "cover", label: "Omslagsbild", type: "image", help: "Visas överst i inlägget och i listor." },
      { name: "excerpt", label: "Sammanfattning", type: "textarea", rows: 3, full: true, help: "En eller två meningar som visas i listor. Lämna tomt för att använda början av texten." },
      { name: "body", label: "Text", type: "markdown", required: true, full: true },
      { name: "slug", label: "Adress", type: "text", help: "Skapas automatiskt från rubriken om fältet är tomt." },
    ],
  },
  {
    key: "kalendarium",
    table: "events",
    label: "Kalendarium",
    singular: "evenemang",
    description: "Evenemang i kalendariet. Extra viktiga evenemang framhävs med mörk datumruta. Passerade evenemang döljs automatiskt.",
    titleColumn: "title",
    orderBy: "starts_at DESC",
    search: ["title", "subtitle", "location", "description"],
    revalidate: ["/", "/kalendarium"],
    publicPath: (r) => `/kalendarium/${r.id}`,
    validate: (v) =>
      v.ends_at && v.starts_at && String(v.ends_at) < String(v.starts_at)
        ? { ends_at: "Slutet kan inte vara före början." }
        : null,
    columns: [
      { name: "starts_at", label: "Datum", format: "datetime" },
      { name: "title", label: "Evenemang" },
      { name: "kind", label: "Typ", format: "kind" },
      { name: "location", label: "Plats" },
    ],
    fields: [
      { name: "title", label: "Namn på evenemanget", type: "text", required: true, full: true, placeholder: "t.ex. SnöYra" },
      { name: "starts_at", label: "Börjar", type: "datetime", required: true, help: "Lämna tiden tom om den inte är bestämd." },
      { name: "ends_at", label: "Slutar", type: "datetime" },
      { name: "kind", label: "Typ", type: "select", options: KIND_OPTIONS, defaultValue: "vanlig", help: "Extra viktiga evenemang framhävs med mörk datumruta i kalendariet. Tips visas i kursiv stil." },
      { name: "location", label: "Plats", type: "text", placeholder: "t.ex. Norrlands nation" },
      { name: "link", label: "Länk", type: "url", full: true, placeholder: "https://facebook.com/events/…", help: "Till exempel Facebook-evenemanget eller anmälan." },
      {
        name: "subtitle",
        label: "Rubrik på evenemangssidan",
        type: "text",
        full: true,
        placeholder: "t.ex. ÄLGGASQUEN – en 04-gask på Norrlands Nation",
        help: "Visas som rubrik ovanför beskrivningen på evenemangets sida.",
      },
      { name: "description", label: "Beskrivning", type: "textarea", rows: 5, full: true },
      { name: "poster", label: "Affisch", type: "image", help: "Till exempel en bild eller affisch från Instagram. Visas bredvid evenemanget i kalendariet." },
    ],
  },
  {
    key: "sangbok",
    table: "songs",
    label: "Sångbok",
    singular: "sång",
    description: "Sångerna i den sökbara sångboken.",
    titleColumn: "title",
    slugFrom: "title",
    orderBy: "CASE WHEN number IS NULL THEN 1 ELSE 0 END, number, title COLLATE NOCASE",
    search: ["title", "melody", "lyrics", "category"],
    revalidate: ["/sangbok"],
    publicPath: (r) => `/sangbok/${r.slug}`,
    columns: [
      { name: "number", label: "Nr" },
      { name: "title", label: "Titel" },
      { name: "melody", label: "Melodi" },
      { name: "category", label: "Kategori" },
    ],
    fields: [
      { name: "title", label: "Titel", type: "text", required: true, full: true },
      { name: "number", label: "Nummer i sångboken", type: "number" },
      { name: "category", label: "Kategori", type: "text", suggestionsFrom: "category", placeholder: "t.ex. Snapsvisor" },
      { name: "melody", label: "Melodi", type: "text", full: true, placeholder: "t.ex. Helan går" },
      { name: "lyrics", label: "Text", type: "lyrics", required: true, full: true, rows: 18, help: "Radbrytningar sparas precis som du skriver dem. Lämna en tom rad mellan verserna." },
      { name: "notes", label: "Kommentar", type: "textarea", rows: 3, full: true, help: "Till exempel när sången sjungs eller vem som skrev den." },
      { name: "slug", label: "Adress", type: "text", help: "Skapas automatiskt från titeln om fältet är tomt." },
    ],
  },
  {
    key: "styrelsen",
    table: "board_members",
    label: "Styrelsen",
    singular: "styrelsemedlem",
    description: "Styrelseposterna som visas på sidan Styrelsen. Rubriken och gruppbilden ändras under Inställningar.",
    titleColumn: "role",
    orderBy: "sort_order, id",
    sortable: true,
    search: ["role", "name"],
    revalidate: ["/styrelsen"],
    columns: [
      { name: "image", label: "", format: "image" },
      { name: "role", label: "Post" },
      { name: "role_description", label: "Beskrivning" },
      { name: "name", label: "Namn" },
    ],
    fields: [
      { name: "role", label: "Post", type: "text", required: true, placeholder: "t.ex. ÖverYpsa" },
      { name: "role_description", label: "Vad posten innebär", type: "text", placeholder: "t.ex. Ordförande" },
      { name: "name", label: "Namn", type: "text", required: true, full: true },
      { name: "email", label: "E-post", type: "email" },
      { name: "image", label: "Porträtt", type: "image", help: "Visas som en rund bild. Utan bild visas initialerna." },
    ],
  },
  {
    key: "overypsor",
    table: "former_chairs",
    label: "ÖverYpsor",
    singular: "ÖverYpsa",
    description: "Alla som har varit ordförande. Listan sorteras efter det första årtalet i perioden.",
    titleColumn: "name",
    orderBy: "sort_year DESC, sort_order DESC, id DESC",
    search: ["period", "name", "note"],
    revalidate: ["/overypsor"],
    derive: (v) => ({ ...v, sort_year: firstYear(String(v.period ?? "")) }),
    columns: [
      { name: "period", label: "Period" },
      { name: "name", label: "Namn" },
      { name: "note", label: "Kommentar" },
    ],
    fields: [
      { name: "period", label: "Period", type: "text", required: true, placeholder: "t.ex. 2025 eller 2025 VT", help: "Skriv året först. HT och VT går bra." },
      { name: "name", label: "Namn", type: "text", required: true },
      { name: "note", label: "Kommentar", type: "text", full: true },
      { name: "sort_order", label: "Ordning inom samma år", type: "number", defaultValue: 1, help: "Används när flera har suttit samma år, t.ex. 1 för VT och 2 för HT." },
      { name: "image", label: "Bild", type: "image" },
    ],
  },
  {
    key: "hedersypsor",
    table: "honorary_members",
    label: "HedersYpsor",
    singular: "HedersYpsa",
    description: "Föreningens hedersmedlemmar.",
    titleColumn: "name",
    orderBy: "year DESC, id DESC",
    search: ["name", "motivation"],
    revalidate: ["/hedersypsor"],
    columns: [
      { name: "year", label: "År" },
      { name: "name", label: "Namn" },
      { name: "motivation", label: "Motivering" },
    ],
    fields: [
      { name: "year", label: "Utnämnd år", type: "number", required: true },
      { name: "name", label: "Namn", type: "text", required: true },
      { name: "motivation", label: "Motivering", type: "textarea", rows: 3, full: true },
      { name: "image", label: "Bild", type: "image" },
    ],
  },
  {
    key: "kontakter",
    table: "contacts",
    label: "Kontakter",
    singular: "kontakt",
    description: "E-postadresser som visas på kontaktsidan.",
    titleColumn: "role",
    orderBy: "sort_order, id",
    sortable: true,
    search: ["role", "email"],
    revalidate: ["/kontakt", "/om-ypsilon"],
    columns: [
      { name: "role", label: "Post" },
      { name: "email", label: "E-post" },
      { name: "description", label: "Beskrivning" },
    ],
    fields: [
      { name: "role", label: "Post eller rubrik", type: "text", required: true, placeholder: "t.ex. Yngling" },
      { name: "email", label: "E-post", type: "email", required: true },
      { name: "description", label: "När ska man kontakta den här personen?", type: "textarea", rows: 3, full: true },
    ],
  },
  {
    key: "galleri",
    table: "albums",
    label: "Galleri",
    singular: "album",
    description: "Fotoalbum. Skapa albumet först och ladda sedan upp bilderna.",
    titleColumn: "title",
    slugFrom: "title",
    orderBy: "COALESCE(CAST(substr(event_date, 1, 4) AS INTEGER), year, CAST(substr(created_at, 1, 4) AS INTEGER)) DESC, event_date DESC, id DESC",
    search: ["title", "description", "photographer"],
    revalidate: ["/galleri"],
    derive: (v) => ({ ...v, year: v.event_date ? firstYear(String(v.event_date)) : v.year }),
    publicPath: (r) => `/galleri/${r.slug}`,
    columns: [
      { name: "cover_or_first", label: "", format: "image" },
      { name: "title", label: "Album" },
      { name: "year", label: "År" },
      { name: "image_count", label: "Bilder" },
      { name: "published", label: "Publicerat", format: "boolean" },
    ],
    fields: [
      { name: "title", label: "Namn på albumet", type: "text", required: true, full: true, placeholder: "t.ex. Älggasquen 2026" },
      { name: "event_date", label: "Datum", type: "date", help: "Albumen sorteras och grupperas efter år." },
      { name: "year", label: "År", type: "number", help: "Fylls i automatiskt från datumet. Ange bara året om exakt datum saknas." },
      { name: "photographer", label: "Fotograf", type: "text" },
      { name: "published", label: "Visa på hemsidan", type: "checkbox", defaultValue: true },
      { name: "cover", label: "Omslagsbild", type: "image", help: "Lämna tomt för att använda albumets första bild." },
      { name: "description", label: "Beskrivning", type: "textarea", rows: 3, full: true },
      { name: "slug", label: "Adress", type: "text", help: "Skapas automatiskt från namnet om fältet är tomt." },
    ],
  },
];

export function getEntity(key: string) {
  return ENTITIES.find((e) => e.key === key) ?? null;
}

export { slugify };
