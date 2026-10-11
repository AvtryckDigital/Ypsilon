import "server-only";
import type { Field } from "./fields";

export type FormState = { error?: string; fieldErrors?: Record<string, string> } | null;
type Value = string | number | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

/**
 * Läser och kontrollerar formulärvärden enligt fältdefinitionerna.
 * Returnerar antingen värdena eller felmeddelanden per fält.
 */
export function parseFields(fields: Field[], form: FormData) {
  const values: Record<string, Value> = {};
  const errors: Record<string, string> = {};

  for (const f of fields) {
    const raw = form.get(f.name);
    const str = typeof raw === "string" ? raw : "";
    let value: Value = null;

    switch (f.type) {
      case "checkbox":
        value = form.get(f.name) === "on" ? 1 : 0;
        break;
      case "number": {
        const t = str.trim();
        if (t) {
          const n = Number(t.replace(",", "."));
          if (!Number.isFinite(n)) errors[f.name] = "Ange ett tal.";
          else value = Math.round(n);
        }
        break;
      }
      case "date": {
        const t = str.trim();
        if (t && !DATE.test(t)) errors[f.name] = "Ange ett giltigt datum.";
        value = t || null;
        break;
      }
      case "datetime": {
        const d = String(form.get(`${f.name}__date`) ?? "").trim();
        const t = String(form.get(`${f.name}__time`) ?? "").trim();
        if (!d && t) errors[f.name] = "Ange ett datum till tiden.";
        else if (d && !DATE.test(d)) errors[f.name] = "Ange ett giltigt datum.";
        else if (t && !TIME.test(t)) errors[f.name] = "Ange tiden som tt:mm.";
        value = d ? (t ? `${d}T${t}` : d) : null;
        break;
      }
      case "email": {
        const t = str.trim();
        if (t && !EMAIL.test(t)) errors[f.name] = "Ange en giltig e-postadress.";
        value = t || null;
        break;
      }
      case "url": {
        const t = str.trim();
        if (t && !/^(https?:\/\/|\/|mailto:)/i.test(t)) errors[f.name] = "Länken ska börja med https://";
        value = t || null;
        break;
      }
      case "select": {
        const t = str.trim();
        if (t && f.options && !f.options.some((o) => o.value === t)) errors[f.name] = "Välj ett alternativ i listan.";
        value = t || null;
        break;
      }
      case "image":
      case "file": {
        const t = str.trim();
        if (t && !/^(\/media\/|https?:\/\/)/.test(t)) errors[f.name] = "Ogiltig fil.";
        value = t || null;
        break;
      }
      case "markdown":
      case "textarea":
      case "lyrics": {
        const t = str.replace(/\r\n/g, "\n").replace(/\s+$/, "");
        value = t.trim() ? t : null;
        break;
      }
      default: {
        const t = str.trim();
        value = t || null;
      }
    }

    if (f.required && (value === null || value === "") && !errors[f.name]) {
      errors[f.name] = "Fältet måste fyllas i.";
    }
    values[f.name] = value;
  }

  return { values, errors };
}

export function errorState(errors: Record<string, string>): FormState {
  return { error: "Kontrollera de markerade fälten.", fieldErrors: errors };
}
