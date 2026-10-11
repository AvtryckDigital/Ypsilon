"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { inputClass } from "@/components/admin/AdminForm";
import { loginAction } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block font-semibold">E-post</span>
        <input
          key={state?.email ?? ""}
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus={!state?.email}
          defaultValue={state?.email ?? ""}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-semibold">Lösenord</span>
        <input name="password" type="password" required autoComplete="current-password" autoFocus={!!state?.email} className={inputClass} />
      </label>
      {state?.error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-[0.95rem] text-red-800" role="alert">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="admin-btn-primary w-full justify-center py-3">
        {pending && <Loader2 size={18} className="animate-spin" aria-hidden />}
        {pending ? "Loggar in…" : "Logga in"}
      </button>
    </form>
  );
}
