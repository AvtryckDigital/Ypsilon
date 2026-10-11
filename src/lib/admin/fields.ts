// Fältdefinitioner som delas mellan servern och formulären i webbläsaren.
// Får bara innehålla data, inga funktioner.

export type FieldType =
  | "text" | "textarea" | "markdown" | "date" | "datetime" | "number"
  | "checkbox" | "select" | "image" | "file" | "email" | "url" | "lyrics";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  /** Fältet tar hela bredden i formuläret. */
  full?: boolean;
  /** Förslag som visas medan man skriver, t.ex. befintliga kategorier. */
  suggestionsFrom?: string;
  defaultValue?: string | number | boolean;
  /** Visar en gruppsrubrik ovanför fältet. */
  group?: string;
  groupDescription?: string;
};

export type ListColumn = {
  name: string;
  label: string;
  format?: "date" | "datetime" | "boolean" | "kind" | "image";
};
