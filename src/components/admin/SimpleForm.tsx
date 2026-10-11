"use client";

import { startTransition, useActionState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { inputClass } from "./AdminForm";

type State = { error?: string; fieldErrors?: Record<string, string> } | null;

export type SimpleField = {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  required?: boolean;
  help?: string;
};

// Litet formulär för konton och lösenord.
export default function SimpleForm({
  action,
  fields,
  submitLabel,
  children,
}: {
  action: (prev: State, form: FormData) => Promise<State>;
  fields: SimpleField[];
  submitLabel: string;
  children?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form
      onSubmit={(e) => {
        // Skickas manuellt så att ifyllda fält finns kvar om något behöver rättas.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="space-y-4"
    >
      {state?.error && !state.fieldErrors && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-red-800" role="alert">{state.error}</p>
      )}
      {fields.map((f) => {
        const err = state?.fieldErrors?.[f.name];
        return (
          <label key={f.name} className="block">
            <span className="mb-1.5 block text-[0.95rem] font-semibold">{f.label}</span>
            <input
              name={f.name}
              type={f.type ?? "text"}
              required={f.required}
              autoComplete={f.autoComplete}
              aria-invalid={err ? true : undefined}
              className={inputClass}
            />
            {f.help && <span className="mt-1 block text-sm text-muted">{f.help}</span>}
            {err && <span className="mt-1 block text-sm font-medium text-red-700">{err}</span>}
          </label>
        );
      })}
      {children}
      <button type="submit" disabled={pending} className="admin-btn-primary">
        {pending && <Loader2 size={17} className="animate-spin" aria-hidden />}
        {submitLabel}
      </button>
    </form>
  );
}
