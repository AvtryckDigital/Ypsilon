"use client";

import Link from "next/link";
import { Fragment, startTransition, useActionState, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { Field } from "@/lib/admin/fields";
import ImageField from "./ImageField";
import MarkdownEditor from "./MarkdownEditor";

type State = { error?: string; fieldErrors?: Record<string, string> } | null;
type Action = (prev: State, form: FormData) => Promise<State>;
type Values = Record<string, string | number | null | undefined>;

export const inputClass =
  "w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-[1rem] text-ink outline-none transition focus:border-royal focus:ring-2 focus:ring-royal/15 aria-[invalid=true]:border-red-400";

function FieldInput({ field, value, error, suggestions }: { field: Field; value: Values[string]; error?: string; suggestions?: string[] }) {
  const id = `f-${field.name}`;
  const describedBy = [field.help ? `${id}-help` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  const common = { id, name: field.name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };
  const str = value === null || value === undefined ? (field.defaultValue !== undefined && typeof field.defaultValue !== "boolean" ? String(field.defaultValue) : "") : String(value);

  switch (field.type) {
    case "markdown":
      return <MarkdownEditor id={id} name={field.name} defaultValue={str} rows={field.rows} invalid={!!error} describedBy={describedBy} />;
    case "textarea":
      return <textarea {...common} defaultValue={str} rows={field.rows ?? 4} placeholder={field.placeholder} className={`${inputClass} resize-y`} />;
    case "lyrics":
      return (
        <textarea
          {...common}
          defaultValue={str}
          rows={field.rows ?? 16}
          className={`${inputClass} resize-y font-[inherit] leading-relaxed`}
          spellCheck
        />
      );
    case "image":
    case "file":
      return <ImageField name={field.name} defaultValue={str} kind={field.type} invalid={!!error} describedBy={describedBy} />;
    case "checkbox": {
      const checked = value === null || value === undefined ? field.defaultValue === true : Number(value) === 1;
      return (
        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-line bg-white px-3.5 py-2.5">
          <input type="checkbox" name={field.name} defaultChecked={checked} aria-describedby={describedBy} className="h-5 w-5 accent-navy" />
          <span className="font-medium">{field.label}</span>
        </label>
      );
    }
    case "select":
      return (
        <select {...common} defaultValue={str} className={inputClass}>
          {!field.required && !field.defaultValue && <option value="">Välj…</option>}
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "datetime": {
      const [d, t] = str.split("T");
      return (
        <div className="flex gap-2">
          <input type="date" name={`${field.name}__date`} id={id} defaultValue={d ?? ""} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={inputClass} />
          <input type="time" name={`${field.name}__time`} defaultValue={t ?? ""} aria-label={`${field.label}, tid`} className={`${inputClass} max-w-36`} />
        </div>
      );
    }
    case "date":
      return <input {...common} type="date" defaultValue={str} className={inputClass} />;
    case "number":
      return <input {...common} type="number" inputMode="numeric" defaultValue={str} placeholder={field.placeholder} className={`${inputClass} max-w-48`} />;
    default: {
      const listId = suggestions?.length ? `${id}-list` : undefined;
      return (
        <>
          <input
            {...common}
            type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
            defaultValue={str}
            placeholder={field.placeholder}
            list={listId}
            className={inputClass}
          />
          {listId && (
            <datalist id={listId}>
              {suggestions!.map((s) => <option key={s} value={s} />)}
            </datalist>
          )}
        </>
      );
    }
  }
}

export default function AdminForm({
  fields,
  values = {},
  action,
  submitLabel = "Spara",
  cancelHref,
  suggestions = {},
}: {
  fields: Field[];
  values?: Values;
  action: Action;
  submitLabel?: string;
  cancelHref?: string;
  suggestions?: Record<string, string[]>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [dirty, setDirty] = useState(false);

  // Varnar om man lämnar sidan med osparade ändringar.
  useEffect(() => {
    if (!dirty || pending) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, pending]);

  return (
    <form
      onSubmit={(e) => {
        // Skickas manuellt så att React inte tömmer formuläret om något fält behöver rättas.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      onChange={() => setDirty(true)}
      className="space-y-6"
      noValidate
    >
      {state?.error && (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800" role="alert">
          <AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden />
          <p>{state.error}</p>
        </div>
      )}

      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {fields.map((f) => {
          const error = state?.fieldErrors?.[f.name];
          return (
            <Fragment key={f.name}>
            {f.group && (
              <div className="border-b border-line pb-2 pt-4 first:pt-0 sm:col-span-2">
                <h2 className="text-2xl text-navy">{f.group}</h2>
                {f.groupDescription && <p className="text-sm text-muted">{f.groupDescription}</p>}
              </div>
            )}
            <div className={f.full || ["markdown", "lyrics", "image", "file"].includes(f.type) ? "sm:col-span-2" : ""}>
              {f.type !== "checkbox" && (
                <label htmlFor={`f-${f.name}`} className="mb-1.5 block text-[0.95rem] font-semibold text-ink">
                  {f.label}
                  {f.required && <span className="ml-1 text-red-700" aria-hidden>*</span>}
                  {f.required && <span className="sr-only"> (obligatoriskt)</span>}
                </label>
              )}
              <FieldInput field={f} value={values[f.name]} error={error} suggestions={f.suggestionsFrom ? suggestions[f.suggestionsFrom] : undefined} />
              {f.help && <p id={`f-${f.name}-help`} className="mt-1.5 text-sm text-muted">{f.help}</p>}
              {error && <p id={`f-${f.name}-err`} className="mt-1.5 text-sm font-medium text-red-700">{error}</p>}
            </div>
            </Fragment>
          );
        })}
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <button type="submit" disabled={pending} className="admin-btn-primary">
          {pending && <Loader2 size={17} className="animate-spin" aria-hidden />}
          {pending ? "Sparar…" : submitLabel}
        </button>
        {cancelHref && (
          <Link href={cancelHref} className="admin-btn-secondary">Avbryt</Link>
        )}
        {dirty && !pending && <span className="text-sm text-muted">Osparade ändringar</span>}
      </div>
    </form>
  );
}
